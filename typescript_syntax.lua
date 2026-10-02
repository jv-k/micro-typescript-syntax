VERSION = "1.0.0"

local config = import("micro/config")

-- Register the syntax files when micro loads this script, not in init():
-- micro opens the files named on the command line before it runs init().
config.AddRuntimeFile("typescript_syntax", config.RTSyntax, "typescript.yaml")
config.AddRuntimeFile("typescript_syntax", config.RTSyntax, "typescript-rules.yaml")
config.AddRuntimeFile("typescript_syntax", config.RTSyntax, "tsx.yaml")
config.AddRuntimeFile("typescript_syntax", config.RTSyntax, "jsx-tags.yaml")
