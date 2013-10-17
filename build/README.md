Folder: build/
========

This folder containes the **build system** of xml3d.js.

## How to build xml3d.js

You can build xml3d.js using Ant. The main build file is [build.xml](build.xml) in this folder.

There are 2 building modes: 

1. The 'develop' build option simply concatenated all files. 
2. the 'develop-min' build option performs an additional compression with Closure Compiler (simple mode). This option also performs additional type and syntax checks to find errors.

### Building xml3d.js with Eclipse

1. Create an Eclipse project from the xml3d.js folder
2. Open the file [build/build.xml](build.xml)
3. In the *Outline* panel, right click **develop** or **develop-min* depending on how you want to build
4. Select **Run As > Ant Build**

### Building xml3d.js with Webstorm / PHPStorm

1. Install Ant (e.g. with the binary distribution: http://ant.apache.org/bindownload.cgi)
2. In Webstorm select **Settings > External Tools**
3. Press the **green plus** to add a new tool
4. Fill out the form
  1. Name: **Ant** (or something like that)
  2. Group: **Leave empty** for quicker selection or fill in whatever you like
  3. Under Options, **only activate "Open Console"**
  4. Show in: Leave it as is
  5. Program: Link to the **\bin\ant.bat** inside the Ant installation folder (or an equivalent file on non windows OS)
  6. Parameters: **-f $FileName$**
  7. Working Directory: **$FileDir$**
  8. Submit!
5. Once the external tool is configured, rightclick the [build/build.xml](build.xml) file and select the tool from the List (e.g. look for **Ant** or **[GroupName] > Ant** if you specified a group)

## How to add new files to the build system

The xml3d.js build system builds separate modules for each subfolder in  [src/](../src/).
To add new files to the build system do the following:

1. locate the **build.xml** file in your module (e.g. inside [src/data/](../src/data/) it's [src/data/build.xml](../src/data/build.xml) )
2. Add a new ``<file>`` node referring to the new file inside the ``<filelist>`` node.

Note: The order of the files is important. If your new js file uses (during first execution) a class or function definition of another file, that file must be included first by the build system.

## Closure compilation problems

If you encounter Closure compilation problems when executing the 'develop-min' build with Closure compiler missing the definition of certain external tools, please extend the file [extern.js](extern.js) with any external function / object used by xml3d.js.
