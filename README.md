# G-ExtensionStore

Github repository containing the extension archive used in the G-ExtensionStore extension (built-in in G-Earth 1.5+). It synchronizes with discord to publish extensions and collect feedback.

In contrast to what the name suggests, all extensions are free

## Requirements
**Extension requirements**:

* The extension must be compatible with the latest version of G-Earth (at time of submitting)
* The files you submit may not be obfuscated
* Your extension may not contain hardcoded header IDs
   * Always use packet names/hashes for identifying packets
   * You're also allowed to use techniques to detect headers IDs at runtime
   * Only if the above 2 are not applicable, you can require the user to enter header IDs manually
* Your extension is not malicious & is not aimed at disturbing the game
   * This includes extensions which give direct advantages in games and/or competitions
* Your extension must be open-source _(exceptions are possible, contact me for that)_

**Framework requirements**:
* The framework you use must implement the (latest) G-Earth extension API correctly
* For G-Earth to detect if an extension is an installed extension, the following requirements also apply:
    * It must pass a `cookie` and `filename` (which can also be a folder name) to G-Earth on initialization *(CLI arguments)*
    * It must use the `port` *(CLI argument)* to connect with G-Earth
* The process of the extension must end when the socket with G-Earth is closed
* The framework must be included in `store/config.json` -> `frameworks`

## Submitting an extension

#### Steps to add an extension

You need to follow these steps:
1. Fork the base branch of this repository. The base branch will always correspond to the latest G-Earth version.
2. In the `store/extensions/` folder, add a new folder named with the title of your extension
3. The folder you just created can contain 4 files:
    1. `extension.zip` contains all files required to execute the extension *(required)*
    2. `extension.json` contains information of your extension. Its contents are described in the next section. *(required)*
    3. `icon.png` is a 40x40 image for the extension store *(required)*
    4. `screenshot.png` is an optional screenshot for the extension store
5. Open a Pull Request into this github repository with your newly added extension


#### Extension information
The object containing your extension information must look like this *(fields that start with (optional) can also be null, but should still have correct syntax if they are not null)*:
```json
{
    "title": "G-Extension",
    "description": "Description of the extension.\n\nGives you *infinite coins* and much more...",
    "authors": [
      {
        "name": "sirjonasxx",
        "hotel": "(optional) .nl",
        "username": "(optional) sirjonasxx-VII",
        "discord": "(optional) sirjonasxx#2633",
        "twitter": "(optional) sirjonasxx"
      }
    ],
    "version": "0.1.0",
    "categories": ["Building", "Trading", "Others"],
    
    "source": "Url to the source code",
    "readme": "(optional) readme file",
    "releases": "(optional) releases page to share release notes"
    
    "stable": true,
    
    "framework": {
      "name": "Native",
      "version": "1.5"
    },

    "language": "Java",
    "commands": {
      "default": ["java", "-jar", "GClick.jar", "-c", "{cookie}", "-p", "{port}", "-f", "{filename}"],
      "linux": ["(optional) <some OS-specific command...>"]
    },
    
    "compatibility": {
        "systems": ["Linux", "Windows", "Mac"],
        "clients": ["Unity", "Flash"]
    },

    "submissionDate": "15-08-2021 01:16:35",
    "updateDate": "15-08-2021 01:16:35",
    "isOutdated": false
}
```
Most fields are self-explanatory, but some require extra attention:
* `title` must be unique across G-ExtensionStore. Since it will also be a directory name, it can only contain characters that are valid directory names. Also don't include dots and underscores in the title.
* `description` can be a short description but may also be long, and a limited form of styling can be applied to it
* `version` can only contain dots and numbers
* `categories` describe the type of extension, at least 1 type is required. List of possible categories are to be found in `store/config.json`.
* `source` is a required field, it must link to your git repository
* `readme` can point to any URL containing extra information (such as instructions) for your extension, typically it would point to the README file of your repository. It can also be empty or null
* `releases` can point to any URL containing release notes for your extension, typically it would point to the Releases page of your repository. It can also be empty or null
* `stable` must be set to `false` if this extension doesn't always show correct behavior. You're required to have this set to `true` in the initial PR. You can change it to `false` later on if it turns out to be unstable and aren't deploying a fix anytime soon
* `framework.name` must be available in `store/config.json` -> `frameworks`. Possible values currently are `Native` (Java), `G-Python`, `Geode`, `G-Node` and `Xabbo`
* `framework.version` is the version of the framework at time of compilation *(or at time of writing in case of interpreted languages)*. For `Native`, it is just the version of G-Earth
* `commands` contains the commands to execute the extension as if the submitted `extension.zip` file was extracted in the current directory. It has to contain `{cookie}`, `{port}` and `{filename}`. The command is under `commands.default` but you can also add platform-specific commands
* `compatibility.clients`, the clients for which the extension is compatible. Can be one or more of `Unity`, `Flash`, `Nitro` and `Origins`. Note that they are not compatible out of the box, so make sure to test

*Note: it's possible not all of the fields will be used, but they may be used in future G-Earth versions*


## Updating an extension

Create a new version of the extension and follow the steps from "Submitting an extension" again, do not forget to update `extension.json` with the new version.

It is also possible to update an extension without setting a new version, for example when updating the description or screenshot. As soon as you have any changes in `extension.zip`, or if the `commands` value in `extension.json` changes, you need to set a new version.


## Removing an extension

Open a PR and set `isOutdated` to `true` in the json file.

## Other information

#### Notes
* All extensions will be reviewed to not contain malicious code
* The G-ExtensionStore is the main way of installing and publishing G-Earth extensions. In G-Earth 1.5.3+, you have to enable `Experimental mode` in the `Extra` tab to install extensions in the old way. This comes with a warning!

#### Todo
* Create a tool to create the submission
