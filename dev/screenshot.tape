# vhs tape template: renders micro with one colour scheme as a single PNG.
# Run with: ./dev/screenshots.sh   (or: pnpm screenshots)
#
# dev/screenshots.sh fills in {{SCHEME}} and {{CONFIG}} for each colour scheme
# and prepares the isolated micro config before this tape runs. vhs writes an
# animated GIF for every tape; it goes to img/tmp/ (gitignored), and only the
# `Screenshot` PNG is kept.

Output img/tmp/{{SCHEME}}/screenshot.gif

Set Shell "bash"
Set FontFamily "Fira Code"
# Rendered at 2x: vhs has no pixel-density setting, and at 1x the thin glyph
# strokes blend into the background. GitHub scales the PNG down to fit.
Set FontSize 32
Set Width 3200
Set Height 2300
Set Theme { "background": "#1c1c1c", "foreground": "#f8f8f2", "cursor": "#f8f8f2", "selection": "#3f3452" }
Set Padding 0
Set Margin 16
Set MarginFill ""
Set BorderRadius 20
Set WindowBar Colorful
Set WindowBarSize 80
Set TypingSpeed 10ms

Hide
Type "micro -config-dir {{CONFIG}} dev/sample/demo.ts dev/sample/demo.tsx" Enter
Sleep 2s
Show
Sleep 500ms

Screenshot img/screenshot-{{SCHEME}}.png
