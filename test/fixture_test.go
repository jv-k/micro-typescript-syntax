package syntaxtest

import (
	"slices"
	"strings"
	"testing"
)

func TestParseFixture(t *testing.T) {
	f, err := ParseFixture("a.ts", "  x = /a/;\n//    ^^^ constant.string.regex\n//  ^ !constant.string.regex KNOWN-GAP\n  y;\n")
	if err != nil {
		t.Fatal(err)
	}
	if len(f.Code) != 2 || f.Code[1] != "  y;" || f.CodeLine[1] != 4 {
		t.Errorf("code lines: %q %v", f.Code, f.CodeLine)
	}
	want := []Assertion{
		{Line: 2, Target: 0, From: 6, To: 9, Group: "constant.string.regex"},
		{Line: 3, Target: 0, From: 4, To: 5, Group: "constant.string.regex", Negate: true, KnownGap: true},
	}
	if len(f.Assertions) != len(want) {
		t.Fatalf("assertions: %+v", f.Assertions)
	}
	for i, a := range want {
		if f.Assertions[i] != a {
			t.Errorf("assertion %d: got %+v want %+v", i, f.Assertions[i], a)
		}
	}
	if g, _ := ParseFixture("b.tsx", "    x\n//  ^ statement\n"); g.Filetype != "tsx" {
		t.Errorf(".tsx filetype: %q", g.Filetype)
	}
}

func TestParseFixtureErrors(t *testing.T) {
	for name, c := range map[string]struct{ src, want string }{
		"tab":            {"\tx;\n// ^ statement\n", "contains a tab"},
		"crlf":           {"  x;\r\n//^ statement\r\n", "CRLF"},
		"combining":      {"  e\u0301;\n//^ statement\n", ":1: contains a combining mark"},
		"no code":        {"// ^ statement\n", ":1: assertion before any code line"},
		"past end":       {"x;\n//  ^^^ statement\n", ":2: carets run past"},
		"no assert":      {"x;\n", "no assertions"},
		"bad known gap":  {"  x;\n//^ statement\n//^ statement KNOWN_GAP\n", ":3: malformed assertion"},
		"bad group char": {"  x;\n//^ statement\n//^ group-2\n", ":3: malformed assertion"},
	} {
		_, err := ParseFixture(name+".ts", c.src)
		if err == nil || !strings.Contains(err.Error(), c.want) {
			t.Errorf("%s: got error %v, want one containing %q", name, err, c.want)
		}
	}
}

func TestCheck(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	f, err := ParseFixture("c.ts", strings.Join([]string{
		"  x = /a/ + y;",
		"//    ^^^ constant.string.regex",    // holds
		"//  ^ symbol.operator",              // holds
		"//        ^ !constant.string.regex", // holds
		"//          ^ symbol.operator",      // fails: `y` has no group
		"//          ^ default KNOWN-GAP",    // known gap that holds: reported
		"//          ^ statement KNOWN-GAP",  // known gap that fails: not reported
	}, "\n"))
	if err != nil {
		t.Fatal(err)
	}
	var lines []int
	for _, e := range Check(defs, f) {
		lines = append(lines, e.Assertion.Line)
	}
	if want := []int{5, 6}; !slices.Equal(lines, want) {
		t.Errorf("failing assertion lines %v, want %v", lines, want)
	}
}

func TestFixtures(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	fixtures, err := LoadFixtures("fixtures")
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range fixtures {
		t.Run(f.Name, func(t *testing.T) {
			for _, e := range Check(defs, f) {
				t.Error(e)
			}
		})
	}
}
