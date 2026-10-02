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
	for name, src := range map[string]string{
		"tab":       "\tx;\n// ^ statement\n",
		"crlf":      "  x;\r\n//^ statement\r\n",
		"combining": "  e\u0301;\n//^ statement\n",
		"no code":   "// ^ statement\n",
		"past end":  "x;\n//  ^^^ statement\n",
		"no assert": "x;\n",
	} {
		if _, err := ParseFixture(name+".ts", src); err == nil {
			t.Errorf("%s: no error", name)
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
