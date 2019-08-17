import fs from "fs";
import settings from "./icon-settings";

class IconGenerator {
    iconDefinitions = {};
    paths: any = {
        iconSrcPath: "./src/svg/",
        iconDestPath: "./dist/images/",
        configDestPath: "./dist/studio-icons.json",
        testExtensionsDestPath: "./test/extensions/",
        testFileNamesDestPath: "./test/filenames/",
        testFolderNamesDestPath: "./test/foldernames/",
        testLangIdsDestPath: "./test/languageIds/"
    };

    init() {
        const icons = settings.iconDefinitions;
        const iconCount = icons.length;

        this.resetAll();

        for (let i = 0; i < iconCount; i++) {
            let icon = icons[i];

            if (icon.iconPath !== "FOR_TEST_ONLY") {
                this.createIcon(icon.iconPath);
                this.createTestFiles(icon);
                this.createIconDefinition(icon);
            } else {
                this.createTestFiles(icon);
            }
        }

        this.createConfigFile();

        return this;
    }

    resetAll() {
        this.clearFolder(this.paths.iconDestPath);
        return this;
    }

    createConfigFile() {
        let configs = {
            hidesExplorerArrows: true,
            iconDefinitions: this.iconDefinitions,
            light: this.createThemeMapping("light"),
            highContrast: this.createThemeMapping("contrast")
        };

        Object.assign(configs, this.createThemeMapping("dark"));

        fs.writeFile(this.paths.configDestPath, JSON.stringify(configs, null, 4), function(err) {
            if (err) {
                return console.log(err);
            }
        });

        return this;
    }

    replaceColors(data, colorSettings) {
        let contents = "";
        let keys = Object.keys(colorSettings);

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let oldColor = settings.colors[key];
            let newColor = settings.colors[settings.dark.colors[key]];

            console.log(oldColor, newColor);

            contents = data.split(oldColor).join(newColor);
        }

        return contents;
    }

    createIcon(iconPath) {
        let colors = settings.colors;
        let srcPath = this.paths.iconSrcPath + iconPath;
        let file = fs.createReadStream(srcPath, "utf8");
        let lightFile = "";
        let darkFile = "";
        let contrastFile = "";
        let lightFilePath = this.paths.iconDestPath + iconPath;
        let darkFilePath = lightFilePath.replace(".svg", "_inverse.svg");
        let contrastFilePath = lightFilePath.replace(".svg", "_contrast.svg");

        file.on("data", function(chunk) {
            lightFile = chunk
                .toString()
                .split(colors.background)
                .join(settings.light.colors.background)
                .split(colors.foreground)
                .join(settings.light.colors.foreground);

            darkFile = chunk
                .toString()
                .split(colors.white)
                .join(settings.dark.colors.foreground)
                .split(colors.background)
                .join(settings.dark.colors.background)
                .split(colors.foreground)
                .join(settings.dark.colors.foreground)
                .split(colors.outline)
                .join(settings.dark.colors.foreground)
                .split(colors.aspBlue)
                .join(settings.dark.colors.aspBlue)
                .split(colors.cppPurple)
                .join(settings.dark.colors.cppPurple)
                .split(colors.csGreen)
                .join(settings.dark.colors.csGreen)
                .split(colors.fsPurple)
                .join(settings.dark.colors.fsPurple)
                .split(colors.vbBlue)
                .join(settings.dark.colors.vbBlue)
                .split(colors.tsOrange)
                .join(settings.dark.colors.tsOrange)
                .split(colors.pyGreen)
                .join(settings.dark.colors.pyGreen)
                .split(colors.vsPurple)
                .join(settings.dark.colors.vsPurple)
                .split(colors.accessRed)
                .join(settings.dark.colors.accessRed)
                .split(colors.wordBlue)
                .join(settings.dark.colors.wordBlue)
                .split(colors.pptRed)
                .join(settings.dark.colors.pptRed)
                .split(colors.projGreen)
                .join(settings.dark.colors.projGreen)
                .split(colors.visioPurple)
                .join(settings.dark.colors.visioPurple)
                .split(colors.excelGreen)
                .join(settings.dark.colors.excelGreen);

            contrastFile = chunk
                .toString()
                .split(colors.white)
                .join(settings.contrast.colors.foreground)
                .split(colors.background)
                .join(settings.contrast.colors.background)
                .split(colors.foreground)
                .join(settings.contrast.colors.foreground)
                .split(colors.outline)
                .join(settings.contrast.colors.outline)
                .split(colors.folderTan)
                .join(settings.contrast.colors.background)
                .split(colors.androidGreen)
                .join(settings.contrast.colors.background)
                .split(colors.aspBlue)
                .join(settings.contrast.colors.background)
                .split(colors.cppPurple)
                .join(settings.contrast.colors.background)
                .split(colors.csGreen)
                .join(settings.contrast.colors.background)
                .split(colors.cssRed)
                .join(settings.contrast.colors.background)
                .split(colors.fsPurple)
                .join(settings.contrast.colors.background)
                .split(colors.jsOrange)
                .join(settings.contrast.colors.background)
                .split(colors.vbBlue)
                .join(settings.contrast.colors.background)
                .split(colors.tsOrange)
                .join(settings.contrast.colors.background)
                .split(colors.gitOrange)
                .join(settings.contrast.colors.background)
                .split(colors.pyGreen)
                .join(settings.contrast.colors.background)
                .split(colors.vsPurple)
                .join(settings.contrast.colors.background)
                .split(colors.sassPurple)
                .join(settings.contrast.colors.background)
                .split(colors.accessRed)
                .join(settings.contrast.colors.background)
                .split(colors.wordBlue)
                .join(settings.contrast.colors.background)
                .split(colors.pptRed)
                .join(settings.contrast.colors.background)
                .split(colors.projGreen)
                .join(settings.contrast.colors.background)
                .split(colors.visioPurple)
                .join(settings.contrast.colors.background)
                .split(colors.excelGreen)
                .join(settings.contrast.colors.background);
        });

        file.on("end", function() {
            fs.writeFile(lightFilePath, lightFile, function(err) {
                if (err) {
                    return console.log(err);
                }
            });

            fs.writeFile(darkFilePath, darkFile, function(err) {
                if (err) {
                    return console.log(err);
                }
            });

            fs.writeFile(contrastFilePath, contrastFile, function(err) {
                if (err) {
                    return console.log(err);
                }
            });
        });

        return this;
    }

    createIconDefinition(icon) {
        let darkPathName = icon.iconPath.replace(".svg", "_inverse.svg");
        let contrastPathName = icon.iconPath.replace(".svg", "_contrast.svg");
        let path = "./images/";

        this.iconDefinitions[icon.iconPath] = {
            iconPath: path + icon.iconPath
        };

        this.iconDefinitions[darkPathName] = {
            iconPath: path + darkPathName
        };

        this.iconDefinitions[contrastPathName] = {
            iconPath: path + contrastPathName
        };

        return this;
    }

    createThemeMapping(type) {
        let postfix = "";
        let theme: any = {
            fileExtensions: {},
            fileNames: {},
            folderNames: {},
            folderNamesExpanded: {},
            languageIds: {}
        };

        if (type == "light") {
            theme.folder = settings.light.folder;
            theme.folderExpanded = settings.light.folderExpanded;
            theme.rootFolder = settings.light.rootFolder;
            theme.rootFolderExpanded = settings.light.rootFolderExpanded;
            theme.file = settings.light.file;
        } else if (type == "contrast") {
            postfix = "_contrast.svg";
            theme.folder = settings.contrast.folder;
            theme.folderExpanded = settings.contrast.folderExpanded;
            theme.rootFolder = settings.contrast.rootFolder;
            theme.rootFolderExpanded = settings.contrast.rootFolderExpanded;
            theme.file = settings.contrast.file;
        } else if (type === "dark") {
            postfix = "_inverse.svg";
            theme.folder = settings.dark.folder;
            theme.folderExpanded = settings.dark.folderExpanded;
            theme.rootFolder = settings.dark.rootFolder;
            theme.rootFolderExpanded = settings.dark.rootFolderExpanded;
            theme.file = settings.dark.file;
        }

        for (let i = 0; i < settings.iconDefinitions.length; i++) {
            let icon = settings.iconDefinitions[i];
            let iconPath = icon.iconPath;

            if (icon.fileExtensions != void 0) {
                for (let j = 0; j < icon.fileExtensions.length; j++) {
                    let extension = icon.fileExtensions[j];

                    theme.fileExtensions[extension] = postfix !== "" ? iconPath.replace(".svg", postfix) : iconPath;
                }
            }

            if (icon.fileNames != void 0) {
                for (let j = 0; j < icon.fileNames.length; j++) {
                    let extension = icon.fileNames[j];

                    theme.fileNames[extension] = postfix !== "" ? iconPath.replace(".svg", postfix) : iconPath;
                }
            }

            if (icon.folderNames != void 0) {
                for (let j = 0; j < icon.folderNames.length; j++) {
                    let extension = icon.folderNames[j];

                    theme.folderNames[extension] = postfix !== "" ? iconPath.replace(".svg", postfix) : iconPath;
                }
            }

            if (icon.folderNamesExpanded != void 0) {
                for (let j = 0; j < icon.folderNamesExpanded.length; j++) {
                    let extension = icon.folderNamesExpanded[j];

                    theme.folderNamesExpanded[extension] =
                        postfix !== "" ? iconPath.replace(".svg", postfix) : iconPath;
                }
            }
        }

        return theme;
    }

    createTestFiles(icon) {
        if (icon.fileExtensions != void 0) {
            let length = icon.fileExtensions.length;
            for (let i = 0; i < length; i++) {
                let extension = icon.fileExtensions[i];
                let filePath = this.paths.testExtensionsDestPath + "_." + extension;
                this.createTestFile(filePath);
            }
        }

        if (icon.fileNames != void 0) {
            let length = icon.fileNames.length;
            for (let i = 0; i < length; i++) {
                let fileName = icon.fileNames[i];
                let filePath = this.paths.testFileNamesDestPath + fileName;
                this.createTestFile(filePath);
            }
        }

        // if (icon.folderNames != void 0) {
        //     let length = icon.folderNames.length;
        //     for (let i = 0; i < length; i++) {
        //         let folderName = icon.folderNames[i];
        //         let folderPath = this.paths.testfolderNamesDestPath + folderName;
        //         this.createTestFolder(folderPath);
        //     }
        // }

        if (icon.languageIds != void 0) {
            let length = icon.languageIds.length;
            for (let i = 0; i < length; i++) {
                let languageId = icon.languageIds[i];
                let filePath = this.paths.testlanguageIdsDestPath + languageId;
                this.createTestFile(filePath);
            }
        }

        return this;
    }

    createTestFile(filePath) {
        fs.writeFile(filePath, "", function(err) {
            if (err) return console.log(err);
        });

        return this;
    }

    createTestFolder(folderPath) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        return this;
    }

    clearFolder(folderPath: string, removeSelf?: boolean) {
        if (removeSelf === undefined) {
            removeSelf = false;
        }

        try {
            let files = fs.readdirSync(folderPath);
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    let filePath = folderPath + files[i];
                    this.removeFile(filePath);
                }
            }
        } catch (e) {
            return;
        }

        if (removeSelf) {
            fs.rmdirSync(folderPath);
        }

        return this;
    }

    removeFile(filePath: string) {
        if (this.fileExistsSync(filePath)) {
            fs.stat(filePath, function(err, fileStat) {
                if (err) {
                    if (err.code == "ENOENT") {
                        console.log("Does not exist.");
                    }
                } else {
                    if (fileStat.isFile()) {
                        fs.unlinkSync(filePath);
                    } else if (fileStat.isDirectory()) {
                        fs.rmdirSync(`file://${filePath}`);
                    }
                }
            });
        }

        return this;
    }

    fileExistsSync(filePath: string) {
        try {
            fs.accessSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    }
}

const iconGenerator = new IconGenerator();
iconGenerator.init();
