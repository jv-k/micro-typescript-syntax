package syntaxtest

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/zyedidia/micro/v2/pkg/highlight"
)

// An Assertion states the group of a span of one code line.
type Assertion struct {
	Line     int    // 1-based line of the assertion in the fixture file
	Target   int    // 0-based index of the code line in Fixture.Code
	From, To int    // rune columns, To exclusive
	Group    string // expected group; "default" also matches no group
	Negate   bool   // `!group`: no column may have the group
	KnownGap bool   // expected to fail
}

// A Fixture is a test file with its assertion lines taken out.
type Fixture struct {
	Name       string
	Filetype   string   // "typescript" or "tsx"
	Code       []string // the code lines, without assertion lines
	CodeLine   []int    // 1-based fixture line of each code line
	Assertions []Assertion
}

// A Failure is an assertion that did not hold, or a known gap that did.
type Failure struct {
	Fixture   *Fixture
	Assertion Assertion
	Got       []string // groups of the asserted columns
}

// caretLine is any line that looks like an assertion, so a typo in one is an
// error instead of a silent code line.
var caretLine = regexp.MustCompile(`^\s*//\s*\^`)

var assertionLine = regexp.MustCompile(`^(\s*//\s*)(\^+)\s+(!?)([A-Za-z][A-Za-z.]*)(\s+KNOWN-GAP)?\s*$`)

// ParseFixture splits a fixture into code lines and assertions. An assertion
// line applies to the nearest code line above it. Assertion lines are removed
// before highlighting, so they never open or close a region.
func ParseFixture(name, src string) (*Fixture, error) {
	f := &Fixture{Name: name, Filetype: "typescript"}
	if strings.HasSuffix(name, ".tsx") {
		f.Filetype = "tsx"
	}
	if strings.Contains(src, "\t") {
		return nil, fmt.Errorf("%s: contains a tab; use spaces so caret columns line up", name)
	}
	if strings.Contains(src, "\r") {
		return nil, fmt.Errorf("%s: has CRLF line endings; use LF", name)
	}
	for i, line := range strings.Split(strings.TrimSuffix(src, "\n"), "\n") {
		if highlight.CharacterCountInString(line) != utf8.RuneCountInString(line) {
			return nil, fmt.Errorf("%s:%d: contains a combining mark; caret columns can't line up", name, i+1)
		}
		m := assertionLine.FindStringSubmatch(line)
		if m == nil && caretLine.MatchString(line) {
			return nil, fmt.Errorf("%s:%d: malformed assertion; want carets, a group or !group, and optional KNOWN-GAP", name, i+1)
		}
		if m == nil {
			f.Code = append(f.Code, line)
			f.CodeLine = append(f.CodeLine, i+1)
			continue
		}
		if len(f.Code) == 0 {
			return nil, fmt.Errorf("%s:%d: assertion before any code line", name, i+1)
		}
		a := Assertion{
			Line:     i + 1,
			Target:   len(f.Code) - 1,
			From:     utf8.RuneCountInString(m[1]),
			Negate:   m[3] == "!",
			Group:    m[4],
			KnownGap: m[5] != "",
		}
		a.To = a.From + len(m[2])
		if n := utf8.RuneCountInString(f.Code[a.Target]); a.To > n {
			return nil, fmt.Errorf("%s:%d: carets run past the end of line %d", name, a.Line, f.CodeLine[a.Target])
		}
		f.Assertions = append(f.Assertions, a)
	}
	if len(f.Assertions) == 0 {
		return nil, fmt.Errorf("%s: no assertions", name)
	}
	return f, nil
}

// LoadFixtures parses every .ts and .tsx file in dir.
func LoadFixtures(dir string) ([]*Fixture, error) {
	paths, err := filepath.Glob(filepath.Join(dir, "*.ts*"))
	if err != nil {
		return nil, err
	}
	var out []*Fixture
	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err != nil {
			return nil, err
		}
		f, err := ParseFixture(filepath.Base(p), string(data))
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

func holds(a Assertion, got []string) bool {
	for _, g := range got {
		match := g == a.Group || (a.Group == "default" && g == "")
		if match == a.Negate {
			return false
		}
	}
	return true
}

// Check highlights the fixture with defs and returns its failures: each
// assertion that does not hold, and each KNOWN-GAP assertion that does.
func Check(defs Defs, f *Fixture) []Failure {
	groups := Groups(defs[f.Filetype], strings.Join(f.Code, "\n"))
	var out []Failure
	for _, a := range f.Assertions {
		got := groups[a.Target][a.From:a.To]
		if holds(a, got) == a.KnownGap {
			out = append(out, Failure{f, a, got})
		}
	}
	return out
}

func (e Failure) String() string {
	a, f := e.Assertion, e.Fixture
	want := a.Group
	if a.Negate {
		want = "not " + want
	}
	what := "want " + want
	if a.KnownGap {
		what = "KNOWN-GAP now holds (" + want + "): remove KNOWN-GAP and the README edge case"
	}
	got := slices.Compact(slices.Clone(e.Got))
	for i, g := range got {
		if g == "" {
			got[i] = "(none)"
		}
	}
	return fmt.Sprintf("%s:%d: %s, got %s\n    %s\n    %s%s",
		f.Name, a.Line, what, strings.Join(got, ", "),
		f.Code[a.Target], strings.Repeat(" ", a.From), strings.Repeat("^", a.To-a.From))
}
