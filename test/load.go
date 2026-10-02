// Package syntaxtest tests the syntax files with micro's own highlighter.
package syntaxtest

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/zyedidia/micro/v2/pkg/highlight"
)

// RuleFiles are the syntax files, by name without `.yaml`.
var RuleFiles = []string{"typescript", "typescript-rules", "tsx", "jsx-tags"}

// Defs maps a filetype ("typescript" or "tsx") to its definition, with
// includes resolved.
type Defs map[string]*highlight.Def

// Load reads the syntax files from root and resolves includes the way micro
// does at runtime. An entry in overrides replaces that file's contents.
func Load(root string, overrides map[string][]byte) (Defs, error) {
	var files []*highlight.File
	defs := Defs{}
	for _, name := range RuleFiles {
		data, ok := overrides[name]
		if !ok {
			var err error
			if data, err = os.ReadFile(filepath.Join(root, name+".yaml")); err != nil {
				return nil, err
			}
		}
		f, err := highlight.ParseFile(data)
		if err != nil {
			return nil, fmt.Errorf("%s.yaml: %w", name, err)
		}
		header, err := highlight.MakeHeaderYaml(data)
		if err != nil {
			return nil, fmt.Errorf("%s.yaml: %w", name, err)
		}
		def, err := highlight.ParseDef(f, header)
		if err != nil {
			return nil, fmt.Errorf("%s.yaml: %w", name, err)
		}
		files = append(files, f)
		defs[f.FileType] = def
	}
	for _, def := range defs {
		highlight.ResolveIncludes(def, files)
	}
	return defs, nil
}

// Groups highlights src and returns the group name of every character, by
// line. Micro's display starts each line with no group and switches at each
// match key, so a character takes the group of the last key at or before it.
// "" means no group. Columns count characters as micro does: a combining
// mark belongs to the character before it.
func Groups(def *highlight.Def, src string) [][]string {
	matches := highlight.NewHighlighter(def).HighlightString(src)
	lines := strings.Split(src, "\n")
	out := make([][]string, len(lines))
	for i, line := range lines {
		row := make([]string, highlight.CharacterCountInString(line))
		cur := ""
		for c := range row {
			if g, ok := matches[i][c]; ok {
				cur = g.String()
			}
			row[c] = cur
		}
		out[i] = row
	}
	return out
}
