# G-ExtensionStore

Github repository containing the extension archive used in the G-ExtensionStore extension (built-in in G-Earth 1.5+).

In contrast to what the name suggests, all extensions are free

## Requirements
**Extension requirements**:

* Your extension must be open-source
* The files you submit may not be obfuscated
* Your extension may not contain hardcoded header IDs
   * Always use packet names/hashes for identifying packets
   * You're also allowed to use techniques to detect headers IDs at runtime
   * Only if the above 2 are not applicable, you can require the user to enter header IDs manually
* Your extension is not malicious & is not aimed at disturbing the game

**Framework requirements**:
* The framework you use must implement the (latest) G-Earth extension API correctly
* For G-Earth to detect if an extension is an installed extension, the following requirements also apply:
    * It must pass a `cookie` and `filename` (which can also be a folder name) to G-Earth on initialization *(CLI arguments)*
    * It must use the `port` *(CLI argument)* to connect with G-Earth
* The process of the extension must end when the socket with G-Earth is closed
* The framework must be included in `frameworks.json`

## Submitting an extension

#### Steps to add an extension

You need to follow these steps:
1. Fork the base branch of this repository. The base branch will always correspond to the latest G-Earth version.
2. In the `store/` folder, add a new folder named `{title}_{version}`. For example if an extension is called G-Mimic, it could look like `G-Mimic_0.1.0`
3. The folder you just created must contain 2 files: `extension.json` and `extension.zip`.
    1. `extension.zip` contains all files required to execute the extension
    2. `extension.json` contains information about your extension. Its contents are described in the next section.
4. Open a Pull Request into this github repository with your newly added extension


#### Extension information
The file containing your extension information must look like this:
```json
{
    "title": "G-Extension",
    "description": "Description of the extension",
    "author": "sirjonasxx",
    "version": "0.1.0",
    
    "source": "Url to the source code",
    "readme": "(optional) readme file",
    
    "stable": true,
    
    "framework": "Native",
    "frameworkVersion": "",
    "language": "Java",
    "executionCommand": "java -jar ... -c {cookie} -p {port} -f {filename}",
    
    "supportedOSes": ["Linux", "Windows", "Mac"],
    "supportedClients": ["Unity", "Flash"]
}
```
Most fields are self explaining, but some require extra attention:
* `title` must be unique across G-ExtensionStore. Since it will also be part of a directory identifier, it can only contain characters that are valid folder names. Also don't include spaces, dots and underscores in the title.
* `version` can only contain dots and numbers
* `source` is a required field, it must link to your git repository
* `readme` can point to any URL containing extra information (such as instructions) for your extension, typically it would point to the README file of your repository. It can also be empty
* `stable` must be set to `false` if this extension doesn't always show correct behavior. You're required to have this set to `true` in the initial PR. You can change it to `false` later on if it turns out to be unstable and aren't deploying a fix anytime soon
* `framework` must be available in `frameworks.json`. Possible values currently are `Native` (Java), `G-Python`, `Geode`, `G-Node` and `Xabbo`
* `frameworkVersion` is the version of the framework at time of compilation *(or at time of writing in case of interpreted languages)*. For `Native`, it is just the version of G-Earth
* `executionCommand` is the command to execute the extension as if the submitted `extension.zip` file was extracted in the current directory. It has to contain `{cookie}`, `{port}` and `{filename}` and must work in all OS's in `supportedOSes`

*Note: it's possible not all of the fields will be used, but they may be used in future G-Earth versions*


## Updating an extension

Create a new version of the extension and follow the steps from "Submitting an extension" again, but also delete the old folder in the PR.

You're only allowed to overwrite existing files if it is to set `stable` to `false`. Otherwise, always create a new version


## Other information

#### Notes
* All extensions will be reviewed to not contain malicious code
* In future versions of G-Earth (not directly), you will have to enable `Experimental mode` in the `Extra` tab to install extensions in the old way. This will come with a warning! This means the G-ExtensionStore will be the main way of installing and publishing extensions

#### Todo
* Github workflow to verify correctness of submissions
* Create a tool to create the `extension.info` and `extension.zip` files