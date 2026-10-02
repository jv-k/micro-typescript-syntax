package syntaxtest

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMutants(t *testing.T) {
	src := []byte(`filetype: x
rules:
    - include: "y"
    - a: "A"
    - r:
        start: "'"
        end: "'"
        skip: "\\\\."
        rules:
            - b: "B"
    - c: "C"
`)
	ms, err := Mutants("x", src)
	if err != nil {
		t.Fatal(err)
	}
	want := []struct {
		line int
		desc string
		gone string
	}{
		{4, `a: "A"`, `a: "A"`},
		{5, `region r from "'"`, `- r:`},
		{8, `skip of region r from "'"`, `skip:`},
		{10, `b: "B"`, `b: "B"`},
		{11, `c: "C"`, `c: "C"`},
	}
	if len(ms) != len(want) {
		t.Fatalf("got %d mutants: %+v", len(ms), ms)
	}
	for i, w := range want {
		m := ms[i]
		if m.Line != w.line || m.Desc != w.desc {
			t.Errorf("mutant %d: got line %d %q, want line %d %q", i, m.Line, m.Desc, w.line, w.desc)
		}
		if strings.Contains(string(m.YAML), w.gone) {
			t.Errorf("mutant %d still contains %q:\n%s", i, w.gone, m.YAML)
		}
		if !strings.Contains(string(m.YAML), `include: "y"`) {
			t.Errorf("mutant %d lost the include:\n%s", i, m.YAML)
		}
	}
}

// TestEveryRuleIsCovered removes each rule, region and region skip in turn
// and fails if no fixture assertion notices.
func TestEveryRuleIsCovered(t *testing.T) {
	fixtures, err := LoadFixtures("fixtures")
	if err != nil {
		t.Fatal(err)
	}
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range fixtures {
		if len(Check(defs, f)) > 0 {
			t.Fatal("TestFixtures fails; fix it first, or every mutant looks caught")
		}
	}
	var uncovered []string
	for _, name := range []string{"typescript-rules", "jsx-tags"} {
		src, err := os.ReadFile(filepath.Join(root, name+".yaml"))
		if err != nil {
			t.Fatal(err)
		}
		mutants, err := Mutants(name, src)
		if err != nil {
			t.Fatal(err)
		}
		for _, m := range mutants {
			defs, err := Load(root, map[string][]byte{name: m.YAML})
			if err != nil {
				t.Fatalf("%s.yaml:%d %s: %v", name, m.Line, m.Desc, err)
			}
			if !caught(defs, fixtures) {
				uncovered = append(uncovered, fmt.Sprintf("    %s.yaml:%d %s", name, m.Line, m.Desc))
			}
		}
	}
	if len(uncovered) > 0 {
		t.Errorf("no fixture assertion fails without these; add an assertion or delete the rule:\n%s",
			strings.Join(uncovered, "\n"))
	}
}

// caught reports whether any assertion that is not a known gap fails.
func caught(defs Defs, fixtures []*Fixture) bool {
	for _, f := range fixtures {
		for _, e := range Check(defs, f) {
			if !e.Assertion.KnownGap {
				return true
			}
		}
	}
	return false
}
