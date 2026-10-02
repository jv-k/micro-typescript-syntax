// Command dump prints micro's group for every character of each file as
// JSON: {"path": [["group", ...], ...]} with one array per line. A file
// ending in .tsx uses the tsx definition; anything else uses typescript.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"

	syntaxtest "github.com/jv-k/micro-typescript-syntax/test"
)

func main() {
	root := flag.String("root", "..", "directory holding the syntax files")
	flag.Parse()
	defs, err := syntaxtest.Load(*root, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, "dump:", err)
		os.Exit(1)
	}
	out := map[string][][]string{}
	for _, path := range flag.Args() {
		src, err := os.ReadFile(path)
		if err != nil {
			fmt.Fprintln(os.Stderr, "dump:", err)
			os.Exit(1)
		}
		ft := "typescript"
		if strings.HasSuffix(path, ".tsx") {
			ft = "tsx"
		}
		out[path] = syntaxtest.Groups(defs[ft], string(src))
	}
	if err := json.NewEncoder(os.Stdout).Encode(out); err != nil {
		fmt.Fprintln(os.Stderr, "dump:", err)
		os.Exit(1)
	}
}
