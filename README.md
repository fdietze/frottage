# Frottage

Regularly updated AI stuff.

## Wallpapers

<div>
<img src="https://fdietze.github.io/frottage/wallpapers/wallpaper-desktop-latest.jpg" height="200" />
<img src="https://fdietze.github.io/frottage/wallpapers/wallpaper-desktop-light-latest.jpg" height="200" />
<img src="https://fdietze.github.io/frottage/wallpapers/wallpaper-mobile-latest.jpg" height="200" />
<img src="https://fdietze.github.io/frottage/wallpapers/wallpaper-mobile-homescreen-latest.jpg" height="200" />
</div>

[view prompts](/prompts.json), [view targets](/targets.json), [view schedule](/.github/workflows/generate-wallpapers.yml#L6)

The images are deployed to:

`https://fdietze.github.io/frottage/wallpapers/wallpaper-<target>-latest.jpg`



## Recipes

<https://fdietze.github.io/frottage/recipes>
(not updating for now. let me know if you want it back or cooked something!)


# Wallpaper Usage

## Linux

### GNOME

```
gsettings set org.gnome.desktop.background picture-uri https://fdietze.github.io/frottage/wallpapers/wallpaper-desktop-latest.jpg
```

### Using feh

```
feh --bg-fill https://fdietze.github.io/frottage/wallpapers/wallpaper-desktop-latest.jpg
```

## Android:

A minimal Android app is on the way (subscribe this issue to get notified: https://github.com/fdietze/frottage/issues/9)

Until then, you can use this automation app:


1. Install Automate: https://play.google.com/store/apps/details?id=com.llamalab.automate&referrer=utm_source%3Dcommunity
2. Download flow: https://llamalab.com/automate/community/flows/45884

## iOS:

1. Import Shortcut from https://www.icloud.com/shortcuts/e45ec32f36954eb4bf8e09db74df42a7
2. Create schedule

## macOS:

1. Import Shortcut

   Light:
   https://www.icloud.com/shortcuts/a7d6a6029698463a9891ede2aa146f28

   Dark: https://www.icloud.com/shortcuts/928200679e1144efa4f8a697934adcfe

2. Create schedule
