import fs from "fs";
import fsp from "fs/promises";
import settings from "./Settings";

type ZedIconThemeFileThemeDirectory = {
	collapsed: string;
	expanded: string;
};

type ZedIconThemeFileThemeFileIcon = {
	path: string;
};

type ZedIconThemeFileTheme = {
	name: string;
	appearance: "dark" | "light";
	directory_icons: ZedIconThemeFileThemeDirectory;
	named_directory_icons: Record<string, ZedIconThemeFileThemeDirectory>;
	chevron_icons: Record<string, string>;
	file_stems: Record<string, string>;
	file_suffixes: Record<string, string>;
	file_icons: Record<string, ZedIconThemeFileThemeFileIcon>;
};

type ZedIconThemeFile = {
	$schema: "https://zed.dev/schema/icon_themes/v0.3.0.json";
	name: string;
	author: string;
	themes: ZedIconThemeFileTheme[];
};

export class IconGenerator {
	iconDefinitions = {};
	paths = {
		iconSrcPath: "./src/svg/",
		iconDestPath: "./dist/images/",
		configDestPath: "./dist/studio-icons.json",
		testExtensionsDestPath: "./test/extensions/",
		testFileNamesDestPath: "./test/filenames/",
		// testFolderNamesDestPath: "./test/foldernames/",
		// testLangIdsDestPath: "./test/languageIds/",
		//
		zedIconDestPath: "./zed/icons/",
		zedIconThemesPath: "./zed/icon_themes/",
		zedConfigDestPath: "./zed/icon_themes/studio-icons-mod.json"
	};

	async init() {
		const icons = settings.iconDefinitions;
		const iconCount = icons.length;

		this.resetAll();

		for (let i = 0; i < iconCount; i++) {
			let icon = icons[i];

			if (icon.iconPath !== "FOR_TEST_ONLY") {
				await this.createIcon(icon.iconPath);
				this.createTestFiles(icon);
				this.createIconDefinition(icon);
			} else {
				this.createTestFiles(icon);
			}
		}

		await this.createConfigFile();
		await this.createZedFiles();
	}

	makeDirectory(dir: string) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
	}

	resetAll() {
		this.clearFolder(this.paths.iconDestPath);
		this.makeDirectory("./dist");
		this.makeDirectory("./dist/images");

		this.makeDirectory(this.paths.zedIconThemesPath);
		this.makeDirectory(this.paths.zedIconDestPath);
		this.clearFolder(this.paths.zedIconThemesPath);
		this.clearFolder(this.paths.zedIconDestPath);
	}

	async createConfigFile() {
		let configs = {
			hidesExplorerArrows: true,
			iconDefinitions: this.iconDefinitions,
			light: this.createThemeMapping("light"),
			highContrast: this.createThemeMapping("contrast")
		};

		Object.assign(configs, this.createThemeMapping("dark"));

		await fsp.writeFile(this.paths.configDestPath, JSON.stringify(configs, null, 4));
	}

	async createZedFiles() {
		const makeTheme = (name: string, appearance: ZedIconThemeFileTheme["appearance"]) => {
			const theme = settings[appearance];
			const resolveIconPath = (file: string) => `./icons/${file}`;
			const fileIcon = (path: string): ZedIconThemeFileThemeFileIcon => ({ path: resolveIconPath(path) });
			const iconsDefs = settings.iconDefinitions;
			const result: ZedIconThemeFileTheme = {
				name: `Studio Icons (${name})`,
				appearance,
				directory_icons: {
					collapsed: resolveIconPath(theme.folder),
					expanded: resolveIconPath(theme.folderExpanded)
				},
				named_directory_icons: {},
				chevron_icons: {},
				file_stems: {},
				file_suffixes: {},
				file_icons: {}
			};

			const suffix = appearance === "dark" ? "_inverse" : "";
			for (const def of iconsDefs) {
				if (def.iconPath && def.iconPath !== "FOR_TEST_ONLY") {
					const stem = def.iconPath.replace(/\.svg/g, "");
					const iconPath = `${stem}${suffix}.svg`;

					if (def.fileNames) {
						for (const filename of def.fileNames) {
							result.file_stems[filename] = stem;
							result.file_icons[stem] = fileIcon(iconPath);
						}
					}
					if (def.fileExtensions) {
						for (const ext of def.fileExtensions) {
							result.file_suffixes[ext] = stem;
							result.file_icons[stem] = fileIcon(iconPath);
						}
					}
					if (def.folderNames) {
						for (const folder of def.folderNames) {
							if (!result.named_directory_icons[folder]) {
								result.named_directory_icons[folder] = {
									collapsed: resolveIconPath(iconPath),
									expanded: ""
								};
							} else {
								result.named_directory_icons[folder].collapsed = resolveIconPath(iconPath);
							}
						}
					}
					if (def.folderNamesExpanded) {
						for (const folder of def.folderNamesExpanded) {
							if (!result.named_directory_icons[folder]) {
								result.named_directory_icons[folder] = {
									collapsed: "",
									expanded: resolveIconPath(iconPath)
								};
							} else {
								result.named_directory_icons[folder].expanded = resolveIconPath(iconPath);
							}
						}
					}
				}
			}

			result.file_icons["default"] = fileIcon(theme.file);

			return result;
		};

		let configs: ZedIconThemeFile = {
			$schema: "https://zed.dev/schema/icon_themes/v0.3.0.json",
			name: "Studio Icons",
			author: "Andrew King",
			themes: [makeTheme("Dark", "dark"), makeTheme("Light", "light")]
		};

		await this.copyIconsToZedDest(configs.themes);

		await fsp.writeFile(this.paths.zedConfigDestPath, JSON.stringify(configs, null, 4));
	}

	async copyIconsToZedDest(_themes: ZedIconThemeFileTheme[]) {
		const files = await fsp.readdir(this.paths.iconDestPath);
		for (const file of files) {
			await fsp.copyFile(`${this.paths.iconDestPath}${file}`, `${this.paths.zedIconDestPath}${file}`);
		}
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

	async createIcon(iconPath: string) {
		return new Promise<void>((resolve, reject) => {
			let colors = settings.colors;
			let srcPath = this.paths.iconSrcPath + iconPath;
			let file = fs.createReadStream(srcPath, "utf8");
			let lightFile = "";
			let darkFile = "";
			let contrastFile = "";
			let lightFilePath = this.paths.iconDestPath + iconPath;
			let darkFilePath = lightFilePath.replace(".svg", "_inverse.svg");
			let contrastFilePath = lightFilePath.replace(".svg", "_contrast.svg");

			file.on("data", (chunk) => {
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

			file.on("end", () => {
				try {
					fs.writeFileSync(lightFilePath, lightFile);
					fs.writeFileSync(darkFilePath, darkFile);
					fs.writeFileSync(contrastFilePath, contrastFile);
					resolve();
				} catch (err) {
					reject(err);
				}
			});
		});
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
	}

	createThemeMapping(type) {
		let postfix = "";
		let theme: any = {
			fileExtensions: {},
			fileNames: {},
			folderNames: {},
			folderNamesExpanded: {}
			// languageIds: {}
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

		// if (icon.languageIds != void 0) {
		// 	let length = icon.languageIds.length;
		// 	for (let i = 0; i < length; i++) {
		// 		let languageId = icon.languageIds[i];
		// 		let filePath = this.paths.testlanguageIdsDestPath + languageId;
		// 		this.createTestFile(filePath);
		// 	}
		// }
	}

	createTestFile(filePath: string) {
		fs.writeFileSync(filePath, "");
	}

	createTestFolder(folderPath: string) {
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath);
		}
	}

	async clearFolder(folderPath: string, removeSelf?: boolean) {
		if (removeSelf === undefined) {
			removeSelf = false;
		}

		let files = await fsp.readdir(folderPath);
		if (files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				let filePath = folderPath + files[i];
				this.removeFile(filePath);
			}
		}

		if (removeSelf) {
			await fsp.rmdir(folderPath);
		}
	}

	async removeFile(filePath: string) {
		if (fs.existsSync(filePath)) {
			const fileStat = fs.statSync(filePath);
			if (fileStat.isFile()) {
				fs.unlinkSync(filePath);
			} else if (fileStat.isDirectory()) {
				await fsp.rmdir(`file://${filePath}`);
			}
		}
	}
}
