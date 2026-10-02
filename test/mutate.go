package syntaxtest

import (
	"fmt"
	"slices"

	"gopkg.in/yaml.v3"
)

// A Mutant is a rules file with one item removed.
type Mutant struct {
	File string // e.g. "typescript-rules"
	Line int    // YAML line of the removed item
	Desc string // what was removed
	YAML []byte
}

// target addresses an item: indices through nested `rules:` sequences, and
// whether to remove the item's `skip:` key instead of the item.
type target struct {
	path []int
	skip bool
}

// Mutants lists every pattern rule, region and region `skip:` in a rules
// file, each as a copy of the file without it.
func Mutants(file string, src []byte) ([]Mutant, error) {
	var doc yaml.Node
	if err := yaml.Unmarshal(src, &doc); err != nil {
		return nil, err
	}
	var out []Mutant
	add := func(t target, line int, desc string) error {
		data, err := remove(src, t)
		if err != nil {
			return err
		}
		out = append(out, Mutant{file, line, desc, data})
		return nil
	}
	var walk func(seq *yaml.Node, path []int) error
	walk = func(seq *yaml.Node, path []int) error {
		for i, item := range seq.Content {
			key, val := item.Content[0], item.Content[1]
			p := append(slices.Clone(path), i)
			switch {
			case key.Value == "include":
			case val.Kind == yaml.ScalarNode:
				if err := add(target{p, false}, key.Line, fmt.Sprintf("%s: %q", key.Value, val.Value)); err != nil {
					return err
				}
			default:
				start := mapValue(val, "start")
				if err := add(target{p, false}, key.Line, fmt.Sprintf("region %s from %q", key.Value, start.Value)); err != nil {
					return err
				}
				if skip := mapValue(val, "skip"); skip != nil {
					if err := add(target{p, true}, skip.Line, fmt.Sprintf("skip of region %s from %q", key.Value, start.Value)); err != nil {
						return err
					}
				}
				if rules := mapValue(val, "rules"); rules != nil {
					if err := walk(rules, p); err != nil {
						return err
					}
				}
			}
		}
		return nil
	}
	if err := walk(mapValue(doc.Content[0], "rules"), nil); err != nil {
		return nil, err
	}
	return out, nil
}

// remove re-parses src and deletes the target, so every mutant starts from
// an untouched tree.
func remove(src []byte, t target) ([]byte, error) {
	var doc yaml.Node
	if err := yaml.Unmarshal(src, &doc); err != nil {
		return nil, err
	}
	seq := mapValue(doc.Content[0], "rules")
	for depth, i := range t.path {
		if depth < len(t.path)-1 {
			seq = mapValue(seq.Content[i].Content[1], "rules")
			continue
		}
		if t.skip {
			region := seq.Content[i].Content[1]
			for k := 0; k < len(region.Content); k += 2 {
				if region.Content[k].Value == "skip" {
					region.Content = slices.Delete(region.Content, k, k+2)
					break
				}
			}
		} else {
			seq.Content = slices.Delete(seq.Content, i, i+1)
		}
	}
	return yaml.Marshal(&doc)
}

func mapValue(m *yaml.Node, key string) *yaml.Node {
	for k := 0; k+1 < len(m.Content); k += 2 {
		if m.Content[k].Value == key {
			return m.Content[k+1]
		}
	}
	return nil
}
