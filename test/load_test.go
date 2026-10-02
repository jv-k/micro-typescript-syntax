package syntaxtest

import (
	"slices"
	"testing"
)

const root = ".."

func TestLoadAndGroups(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, ft := range []string{"typescript", "tsx"} {
		if defs[ft] == nil {
			t.Fatalf("no %s definition", ft)
		}
	}
	got := Groups(defs["typescript"], "x = /a/;\nconst s = `a\nb`;")
	want := [][]string{
		{"", "", "symbol.operator", "", "constant.string.regex", "constant.string.regex", "constant.string.regex", "symbol.punctuation"},
		{"statement.const", "statement.const", "statement.const", "statement.const", "statement.const", "identifier.const", "identifier.const", "", "symbol.operator", "", "constant.quotes", "constant.string"},
		{"constant.string", "constant.quotes", "symbol.punctuation"},
	}
	for i := range want {
		if !slices.Equal(got[i], want[i]) {
			t.Errorf("line %d:\n got  %q\n want %q", i, got[i], want[i])
		}
	}
}

func TestGroupsCountsCharactersLikeMicro(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	// `e` plus a combining acute accent is one character to micro
	if got := Groups(defs["typescript"], "e\u0301 = 1;")[0]; len(got) != 6 || got[4] != "constant.number" {
		t.Errorf("got %q, want 6 columns with constant.number at 4", got)
	}
}

func TestLoadOverride(t *testing.T) {
	defs, err := Load(root, map[string][]byte{"jsx-tags": []byte("filetype: jsx-tags\nrules: []\n")})
	if err != nil {
		t.Fatal(err)
	}
	if g := Groups(defs["tsx"], "<div>")[0][1]; g == "statement.tag" {
		t.Errorf("override ignored: <div> still statement.tag")
	}
}
