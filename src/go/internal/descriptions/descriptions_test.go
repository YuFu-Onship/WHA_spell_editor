package descriptions

import "testing"

func TestDataSetLoaded(t *testing.T) {
	if len(All()) == 0 {
		t.Fatal("embedded descriptions are empty")
	}
}

func TestLookupLanguages(t *testing.T) {
	zh, ok := Lookup("Column", "zh-CN")
	if !ok || zh == "" {
		t.Fatal("missing zh description for Column")
	}
	en, ok := Lookup("Column", "en")
	if !ok || en == "" || en == zh {
		t.Fatal("missing en description for Column")
	}
	ja, ok := Lookup("Column", "ja")
	if !ok || ja == "" {
		t.Fatal("missing ja description for Column")
	}
	if _, ok := Lookup("Not A Symbol", "en"); ok {
		t.Fatal("unknown symbol should have no description")
	}
}
