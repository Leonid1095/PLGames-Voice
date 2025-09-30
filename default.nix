{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell rec {
  buildInputs = [
    # Tools
    pkgs.git
    pkgs.gh

    # Node
    pkgs.nodejs
    pkgs.nodejs.pkgs.pnpm

    # build target: zip
    pkgs.zip

    # build target: deb
    pkgs.dpkg
    pkgs.fakeroot

    # build target: flatpak
    pkgs.flatpak
    pkgs.flatpak-builder
    pkgs.elfutils
    # flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo
  ];
}
