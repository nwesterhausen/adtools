# Active Directory Tools

This is an Electron application which utilizes node-powershell to interact with Active Directory.

## Use

Visit the releases page and download the latest release. The app will auto update after it is installed.

## Development

To clone and run this repository you'll need [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/), and [Yarn](https://yarnpkg.com/en/docs/install#windows-stable) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/nwesterhausen/adtools
# Go into the repository
cd adtools
# Install dependencies
yarn
# Run the app
yarn start
```

### electron-progressbar

To properly run the app using `yarn run`, you will need to modify the code
used in electron-progress bar how it is modified in
[PR #12](https://github.com/AndersonMamede/electron-progressbar/pull/12).

If you are really using yarn, you can modify the electron-progressbar in your
cache and it will maintain that change wherever you yarn. The change in PR12
does not affect currently working code, only adds an optional argument to the
progress-bar creation to allow specifying a remote window.
