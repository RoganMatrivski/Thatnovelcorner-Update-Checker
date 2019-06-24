pkg . -t node12-linux-x64 --out-path ./build/linux;
cp . -vr ./node_modules/opn/xdg-open ./build/linux;
pkg . -t node12-macos-x64 --out-path ./build/macos;
cp   . -vr ./node_modules/opn/xdg-open ./build/macos;
pkg . -t node12-win-x32 --out-path ./build/win;
cp -vr ./node_modules/opn/xdg-open ./build/win;