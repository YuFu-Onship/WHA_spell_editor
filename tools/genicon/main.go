package main

// Generates build/windows/icon.ico from build/appicon.png
// (same convention as the wails CLI: build/appicon.png -> build/windows/icon.ico).

import (
	"fmt"
	"image"
	stdimage "image/draw"
	"image/png"
	"os"
	"path/filepath"

	xdraw "golang.org/x/image/draw"
)

var sizes = []int{256, 64, 48, 32, 16}

func main() {
	srcPath := filepath.Join("..", "..", "build", "appicon.png")
	outPath := filepath.Join("..", "..", "build", "windows", "icon.ico")

	f, err := os.Open(srcPath)
	if err != nil {
		fmt.Println("open source:", err)
		os.Exit(1)
	}
	src, err := png.Decode(f)
	f.Close()
	if err != nil {
		fmt.Println("decode png:", err)
		os.Exit(1)
	}

	// pad to square on a transparent canvas
	side := src.Bounds().Dx()
	if src.Bounds().Dy() > side {
		side = src.Bounds().Dy()
	}
	square := image.NewNRGBA(image.Rect(0, 0, side, side))
	stdimage.Draw(square, square.Bounds(), src, image.Point{
		X: -(side - src.Bounds().Dx()) / 2,
		Y: -(side - src.Bounds().Dy()) / 2,
	}, stdimage.Src)

	type entry struct {
		head []byte
		data []byte
	}
	var entries []entry

	for _, s := range sizes {
		dst := image.NewNRGBA(image.Rect(0, 0, s, s))
		xdraw.CatmullRom.Scale(dst, dst.Bounds(), square, square.Bounds(), stdimage.Over, nil)

		tmp, err := os.CreateTemp("", "icon-*.png")
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		if err := png.Encode(tmp, dst); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		tmp.Close()
		data, err := os.ReadFile(tmp.Name())
		os.Remove(tmp.Name())
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

		wByte, hByte := byte(s), byte(s)
		if s == 256 {
			wByte, hByte = 0, 0
		}
		entries = append(entries, entry{
			head: []byte{
				wByte, hByte, 0, 0,
				1, 0, 32, 0,
				byte(len(data)), byte(len(data) >> 8), byte(len(data) >> 16), byte(len(data) >> 24),
			},
			data: data,
		})
	}

	var ico []byte
	ico = append(ico, 0, 0, 1, 0, byte(len(entries)), 0)
	offset := 6 + 16*len(entries)
	for _, e := range entries {
		off := []byte{byte(offset), byte(offset >> 8), byte(offset >> 16), byte(offset >> 24)}
		ico = append(ico, append(e.head[:12], off...)...)
		offset += len(e.data)
	}
	for _, e := range entries {
		ico = append(ico, e.data...)
	}

	if err := os.WriteFile(outPath, ico, 0o644); err != nil {
		fmt.Println("write ico:", err)
		os.Exit(1)
	}
	fmt.Println("wrote", outPath, len(ico), "bytes")
}
