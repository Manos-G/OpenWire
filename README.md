# OpenWire

OpenWire is a free, open-source tool to draw wire harnesses. It operates in your web browser. You draw the connectors and the wires. OpenWire makes the cut list and the bill of materials (BOM) for you.

**Open OpenWire:** <https://manos-g.github.io/OpenWire/>

> **NOTE:** This link operates after you publish the site. Refer to [Publish OpenWire on GitHub Pages](#publish-openwire-on-github-pages).

The version number is in the top right corner of the page. This README is for version 0.8.0.

## What OpenWire does

- Add connectors with part numbers and prices.
- Put pins on the four sides of a connector, in groups. Give each group a type, for example XT60, Molex Micro-Fit or JST XH. The drawing shows the connector graphic where the pins touch the side.
- Set each pin of a connector as an input or an output.
- Add splitters (lever connectors). Set the number of inputs and the number of outputs for each input.
- Draw vacuum lines (hoses) with their inner and outer diameter, material and color. Connect them to hose barbs, push-in fittings and vacuum tees.
- Add mini vacuum pumps and suction cups, with clear tubes that you can see through in the drawing.
- Draw wires from pin to pin with a mouse, a pen or a finger.
- Give each wire a color, a stripe, a gauge and a length. The colors use the IEC 60757 codes, for example BK, RD and GN. The drawing shows the name, the gauge and the length of each wire.
- Change a wire to a USB or DC cable. The drawing shows a plug at each end: USB-A, USB-B, USB-C, Micro-USB, Mini-USB or a DC barrel plug with its diameters.
- Change a wire to a CSI or DSI flat cable for a Raspberry Pi camera or display. Each end is the standard 15-pin connector or the mini 22-pin connector.
- See the cut list. OpenWire adds an extra length to each wire. You need this length to strip and crimp the wire.
- See the bill of materials. OpenWire puts the parts with the same part number on one line.
- Add a photo to each connector and splitter. The photo shows in the drawing and in the printout.
- Turn a photo in steps of 90° to the left or to the right, and crop it.
- Put a background picture behind the harness, for example a photo of the vehicle or the panel.
- Find problems in the **Checks** tab, for example a wire without a length.
- Undo and redo all changes.
- Select several components and move them together.
- Keep schematics (PDF files, pictures, KiCad files) with the project, in the **Schematics** tab.
- Save the project as one ZIP file on your computer, with the schematics inside. Open the file again at a later time.
- Export the drawing as an SVG file. The SVG file also contains the project, so OpenWire can open it again.
- Download the cut list and the BOM as CSV files for a spreadsheet.
- Print the drawing, the cut list and the BOM. Or save them as a PDF file.
- Use OpenWire on a computer, a tablet or a phone.
- Select a theme: OpenWire Light or Dark, Catppuccin (Latte, Frappé, Macchiato, Mocha) or VS Code (Dark Modern, Dark+, Light Modern). The theme also changes the colors of the drawing.

## Where OpenWire keeps your data

OpenWire has no server and no user accounts. It operates like draw.io. Your project stays in the browser while you work. To keep the project, save it as a file on your computer.

OpenWire also keeps a draft copy in the browser. If you close the tab by accident, OpenWire shows your work again when you open it.

> **CAUTION:** The draft copy is not a backup. The browser deletes it when you delete the site data. Always save your work to a file.

## Publish OpenWire on GitHub Pages

Do this procedure one time. Use a computer, because a phone cannot upload folders to GitHub.

1. Download `OpenWire.zip` and unzip it.
2. On GitHub, open the repository `Manos-G/OpenWire`.
3. Click **uploading an existing file**. If the repository already has files, click **Add file** > **Upload files**.
4. Open the `OpenWire` folder on your computer. Select all the files and folders in it.
5. Drag them into the GitHub page. Do not drag the `OpenWire` folder itself. The file `index.html` must be at the top level of the repository.
6. Click **Commit changes**.
7. Click **Settings** > **Pages**.
8. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
9. Set **Branch** to `main` and the folder to `/ (root)`. Click **Save**.
10. Wait approximately one minute. Then open <https://manos-g.github.io/OpenWire/>.

To publish a new version, upload the changed files again. GitHub Pages updates the site in approximately one minute.

> **NOTE:** GitHub Pages is free for public repositories.

## Use OpenWire

The first time that you open OpenWire, it shows an example harness. To start a new drawing, click **File** > **New drawing**.

### Add a connector

1. Click **Add** > **Connector**. A new connector has no pins.
2. In the **Properties** tab, type the name and the part number.
3. Add the pins. Refer to [Add pins](#add-pins).

To move a connector, drag its dark bar or an empty area of the connector.

### Add pins

A connector has four sides: left, right, top and bottom. Each side has groups of pins. Each group has a type.

1. Click the connector.
2. In the **Properties** tab, find the side in the **Pins** section.
3. Click **+ Pin** to add a pin. If the side has no group, OpenWire makes a group.
4. To add a different connector on the same side, click **+ Group**.
5. In each group, select the **Type**, for example XT60.
6. If necessary, type a **Group name**, for example Battery or J3.
7. Type a name for each pin.

The drawing shows the group name and the type next to the connector graphic, for example "Battery · XT60". A Generic group without a name shows no text.

Wires leave each pin straight out from its side. Pins on the top side connect upward. Pins on the bottom side connect downward.

OpenWire puts the groups and the pins in position. It also makes the connector larger when it needs more space.

The type changes only the graphic. You can give any number of pins to any type. For example, an XT60 group can have four pins.

Each pin has a number. The number does not change when you add or delete other pins. Wires stay on their pins.

- To delete a pin, click **×** next to it.
- To delete a group and its pins, click **Delete group**.
- To move a group to a different side, select a different **Side**.

If a pin has wires, OpenWire asks before it deletes the pin and its wires.

These types are available: Generic (no graphic), XT30, XT60, XT90, EC5, Deans, Anderson Powerpole, Molex Micro-Fit 3.0, Molex Mini-Fit Jr., Molex KK 254, Molex PicoBlade, JST XH, JST PH, JST SM, Dupont 2.54 mm, Deutsch DT, Superseal 1.5, M12 circular, RJ45, DC barrel jack, screw terminal, lever terminal, ring or spade terminal, hose barb (vacuum) and push-in fitting (vacuum).

### Set inputs and outputs

1. Click the connector.
2. In the **Properties** tab, find the pin in the **Pins** list.
3. In the list next to the pin name, select **Input** or **Output**.

The drawing shows **IN** or **OUT** on the pin. The **Properties** tab shows the list of inputs and the list of outputs. The **Checks** tab shows a warning when a wire connects two outputs or two inputs.

### Add a splitter

A splitter is a lever connector. Each input connects inside to its outputs.

1. Click **Add** > **Splitter**.
2. In the **Properties** tab, set **Inputs** and **Outputs per input**.
3. Type a name for each input and each output, for example +12V.

Inputs are always on the left side. Outputs are always on the right side. Each input has a different lever color. When you change the number of inputs or outputs, the wires stay on the same input or output. If you remove a pin that has a wire, OpenWire asks before it deletes the wire.

The BOM shows a splitter as one part. Splitters do not need crimp contacts.

### Add a wire

Use one of these procedures:

- Drag from a pin to a different pin.
- Click one pin. Then click the other pin. On a touch screen, touch the two pins.

A new wire has no length. Type the length in the **Properties** tab. The new wire gets the color, the stripe and the gauge of the last wire.

### Add a USB or DC cable

1. Draw a wire between the two pins.
2. In the **Properties** tab, set **Type** to **USB / DC cable**.
3. Select the plug at each end, for example USB-A and USB-C, or **DC barrel plug**.
4. Type the cable length, the part number and the price.

If an end has a DC barrel plug, the **DC barrel plug** fields show:

1. Select a **Common size**, for example 5.5 × 2.1 mm.
2. Or type the **Outer diameter** and the **Inner (pin) diameter**.

The label of the cable shows USB, DC or USB/DC. The BOM shows the plugs and the barrel size, for example "Cable, USB-A to DC barrel 5.5 × 2.1 mm".

These cables are not in the cut list, because you do not cut them from a reel. The BOM shows them as cables. The next wire that you draw gets the same type as the last wire.

### Add a vacuum line

A vacuum line is a hose, for example from a vacuum pump to a valve.

1. Give the parts a port. Add a pin group with the type **Hose barb (vacuum)** or **Push-in fitting (vacuum)**. Refer to [Add pins](#add-pins).
2. Draw a line between the two ports, as for a wire.
3. In the **Properties** tab, set **Type** to **Vacuum line (hose)**.
4. Select the **Material** and the **Color**. The colors include clear.
5. Select a **Common size**, for example 4 × 7 mm. Or type the **Inner diameter** and the **Outer diameter**.
6. Type the **Length**, the part number and the price per meter.

The drawing shows a hose with a hose clamp at each end. A larger outer diameter gives a wider hose. The label shows VAC and the inner diameter, for example "VAC Ø4".

### Mini vacuum pumps and suction cups

For small projects, for example a pick-and-place tool, use the small 12 V vacuum pumps, suction cups and thin clear tubes.

1. Click **Add** > **Mini vacuum pump**. The pump has the power pins +12V and GND on the left side. It has two hose barbs on the right side: Vacuum (the suction port) and Exhaust.
2. Click **Add** > **Suction cup**. The cup has one hose barb.
3. Draw a line from the **Vacuum** barb of the pump to the barb of the cup. To connect more cups, add a vacuum tee.
4. Set **Type** to **Vacuum line (hose)**, **Color** to **Clear (CL)** and **Common size** to a thin size, for example 3 × 5 mm.

A clear tube shows as a tube that you can see through. The thin sizes are 2 × 4, 2.5 × 4, 3 × 5 and 4 × 6 mm.

The pump and the cup show a graphic in the middle. To change the graphic of a connector, select **Graphic in the middle** in the **Properties** tab: None, Mini vacuum pump or Suction cup. A photo replaces the graphic. The BOM shows the type Pump or Suction cup.

### Split a vacuum line

To split a vacuum line, click **Add** > **Vacuum tee**. A vacuum tee has one input and two outputs. Set **Inputs** and **Outputs per input** to make a manifold.

The cut list shows each vacuum line. A hose gets no extra length for stripping, so the cut length is the length. The BOM shows the hose in meters, for example "Vacuum hose, Silicone, 4 × 7 mm, black". The BOM shows a vacuum tee as a fitting.

The **Checks** tab shows an error when a vacuum line has no length. It shows a warning when the inner diameter is not smaller than the outer diameter.

### Add a CSI or DSI flat cable

1. Draw a wire between the two pins.
2. In the **Properties** tab, set **Type** to **CSI/DSI flat cable**.
3. Set **Use** to **CSI (camera)** or **DSI (display)**.
4. Select the connector at each end:
   - 15 to 15 pins: standard to standard.
   - 22 to 15 pins: mini to standard.
   - 22 to 22 pins: mini to mini.
5. Type the cable length, the part number and the price.

The drawing shows a flat ribbon with a blue stiffener at each end. The label shows CSI or DSI. A flat cable is not in the cut list. The BOM shows it as a cable.

### Change or delete an item

1. Click the connector or the wire.
2. Change the values in the **Properties** tab.
3. To delete the item, push the Delete key. Or click **Delete connector** or **Delete wire**.

When you delete a connector, OpenWire also deletes the wires on it. Click **Undo** to get them back.

To change the harness name, the revision, the author or the extra length per wire, click an empty area of the drawing. The **Properties** tab then shows the harness.

### Add pictures

To add a photo to a connector:

1. Click the connector.
2. In the **Properties** tab, click **Add photo**.
3. Select a picture. On a phone, you can also take a photo with the camera.

The photo shows in the middle of the connector, between the names of the left pins and the right pins. OpenWire makes the connector larger for the photo. On a splitter, the photo shows below the levers. To move the component, you can also drag its photo.

### Turn and crop a picture

1. Select the connector or the splitter. For the background picture, click an empty area of the drawing.
2. Below the picture, click **−90°** to turn the picture to the left, or **+90°** to turn it to the right. Click again to turn it more, for example −180° or +270°.
3. To crop the picture, click **Crop**. Drag the frame or its corners. Then click **Apply**.
4. To show the full picture again, click **Reset**.

OpenWire does not change the picture. It keeps the turn and the crop as settings, so you can always go back to the full picture.

To add a background picture:

1. Click an empty area of the drawing. The **Properties** tab shows the harness.
2. Click **Add background picture**. Select a picture.
3. Use **Size** and **Visibility** to adjust the picture.
4. To move the picture, turn on **Move the picture**. Drag the picture in the drawing. Then turn off **Move the picture**.

You can also drag a picture file into the window. If a connector is selected, the picture becomes its photo. If no connector is selected, the picture becomes the background picture.

OpenWire makes large photos smaller before it keeps them. A connector photo is a maximum of 900 pixels. A background picture is a maximum of 2400 pixels. Each picture adds approximately 50 to 300 kB to the project file.

> **NOTE:** The pictures are in the project file. When you send the file to a different person, the pictures go with it.

### Get the cut list and the BOM

1. Click the **Cut list** tab or the **BOM** tab.
2. Click **Copy** to paste the table into a spreadsheet. Or click **Download CSV**.

The cut length is the wire length plus the extra length per wire. The BOM counts one contact for each pin that has a wire.

### Find problems

The **Checks** tab shows errors, warnings and notes. The number on the tab shows the errors and the warnings. Click a line to select the item. Then correct the item in the **Properties** tab.

### Select several components

- Hold Shift (or Ctrl, or ⌘ on a Mac) and click a component to add it to the selection. Do this again to remove it.
- Hold Shift and drag on an empty area to select all the components in a box.
- On a touch screen, push the **Select** button (the dashed square) in the top bar. Then touch the components, or drag a box on an empty area. Push the button again to stop. Use two fingers to move the drawing.
- Push Ctrl+A (⌘A on a Mac) to select all the components.

Drag one of the selected components to move all of them. The arrow keys move them by 10, or by 50 with Shift. **Duplicate all** and **Delete all** are in the **Properties** tab. All the changes make one undo step.

### Keep schematics with the project

1. Click the **Schematics** tab.
2. Click **Add files**, or drag the files into the tab. You can add PDF files, pictures, KiCad files and other files.
3. Type a name and a note for each file, for example "Rev. B".

- To see a file, click **Open** or click its picture. The browser shows PDF files and pictures in a new tab.
- To get a copy of a file, click **Download**.
- To remove a file, click **Delete**. Undo brings it back.

OpenWire saves the schematics inside the project ZIP file. The files do not change.

### Save and open files

- To save, click **File** > **Save**, or push Ctrl+S. OpenWire saves one ZIP file, for example `harness.openwire.zip`.
- To open a file, click **File** > **Open**, or push Ctrl+O. You can also drag a file into the window.
- OpenWire opens `.openwire.zip` files, `.openwire.json` files and the SVG files that it exported.
- If you open a `.openwire.json` file, **Save** writes a `.openwire.json` file again. The schematic files are then inside the text.
- To get the project as one JSON text file, click **File** > **Export project as JSON text**.

### Print or save as PDF

1. Click **File** > **Print or save as PDF**.
2. In the print window, select **Save as PDF** as the printer. Or select a printer.

The drawing is on the first page. The cut list and the BOM are on the next pages.

## Select a theme

1. Click the palette button in the top right corner.
2. Select a theme.

These themes are available:

| Group | Themes |
| --- | --- |
| OpenWire | Same as this device, OpenWire Light, OpenWire Dark |
| Catppuccin | Latte, Frappé, Macchiato, Mocha |
| VS Code | Dark Modern, Dark+, Light Modern |

The theme changes the colors of the app and of the drawing, including the background. The wire colors do not change.

OpenWire keeps your theme in this browser. The theme is not in the project file.

> **NOTE:** Printouts and exported SVG files always use the light colors, because they are for paper and for other programs.

## Keyboard shortcuts

| Action | Windows and Linux | Mac |
| --- | --- | --- |
| Save | Ctrl+S | ⌘S |
| Save as | Ctrl+Shift+S | ⇧⌘S |
| Open | Ctrl+O | ⌘O |
| Undo | Ctrl+Z | ⌘Z |
| Redo | Ctrl+Shift+Z or Ctrl+Y | ⇧⌘Z or ⌘Y |
| Duplicate the selected components | Ctrl+D | ⌘D |
| Select all the components | Ctrl+A | ⌘A |
| Add a component to the selection | Shift+click | ⇧ click |
| Select the components in a box | Shift+drag | ⇧ drag |
| Move the selected components | Arrow keys (Shift: 50) | Arrow keys (⇧: 50) |
| Delete the selected item | Delete or Backspace | Delete |
| Stop a wire, or clear the selection | Esc | Esc |
| Zoom in or zoom out | + or − | + or − |
| Show the full drawing | F | F |

To move the drawing, drag the background, or scroll. To zoom, push Ctrl and scroll. On a touch screen, pinch with two fingers to zoom.

## Browser support

| Browser | What Save does |
| --- | --- |
| Chrome, Edge and Opera on a computer | OpenWire saves to the same file again. The browser can ask for permission. |
| Firefox and Safari | The browser downloads a new copy each time. It can add a number to the name, for example `harness (1).openwire.zip`. |
| Phones and tablets | The browser downloads a new copy each time. |

## File format

OpenWire saves a project as a ZIP file (`.openwire.zip`). The ZIP file contains:

```text
project.json                       The project as JSON text
schematics/<id>-<file name>        Each schematic file, not changed
```

You can open the ZIP file with any ZIP program. You can compare two versions of `project.json` in Git.

`project.json` (and a `.openwire.json` file) has this structure:

```json
{
  "format": "openwire",
  "version": 1,
  "meta": { "name": "Tail lamp harness", "author": "", "revision": "A" },
  "settings": { "cutMargin": 20, "currency": "€" },
  "connectors": [
    {
      "id": "c-x1", "kind": "connector", "ref": "X1", "x": 0, "y": 40, "partNumber": "DT06-08SA",
      "sides": {
        "left": [],
        "right": [{ "id": "g-1", "type": "dt", "pins": [{ "n": 1, "label": "GND", "role": "" }] }],
        "top": [],
        "bottom": []
      }
    }
  ],
  "wires": [
    {
      "id": "w-1", "ref": "W1",
      "from": { "connector": "c-x1", "pin": 1 },
      "to": { "connector": "c-x2", "pin": 1 },
      "color": "BK", "stripe": "", "gauge": "0.75 mm²", "length": 900
    }
  ]
}
```

- A connector has `sides`. Each side is a list of groups. Each group has a `type` and `pins`.
- Each pin has a number `n`. Wires refer to pins by this number. Pin numbers start at 1.
- A group can have a `name`. The drawing shows the name and the type.
- Files from older versions have a `pins` list on each connector. OpenWire opens them and puts the pins in one group, on the side where most of the wires go.
- Lengths are in millimeters.
- The `images` part contains the pictures as text (data URLs). A connector refers to its photo with the `image` field. The `background` part refers to the background picture.
- `photoRotation` and `rotation` are the turn in degrees. `photoCrop` and `crop` are fractions of the picture: `{ "x": 0.1, "y": 0, "w": 0.8, "h": 1 }`.
- A splitter has `"kind": "splitter"`, `poles` (inputs) and `outputs` (outputs for each input). Its pins are the inputs first, then the outputs of input 1, then the outputs of input 2.
- A pin can have `"role": "in"` or `"role": "out"`.
- A USB cable is a wire with `"kind": "usb"`, `usbA`, `usbB` and `price`.
- `schematics` is the list of schematics: `id`, `file`, `name` and `note`. `files` gives the `name`, `type`, `size` and the `path` in the ZIP file of each file. In a `.openwire.json` file, each file also has its contents as a data URL (`data`).
- A USB or DC cable can have `"usbA": "BARREL"` or `"usbB": "BARREL"`. Then `barrelOuter` and `barrelInner` give the diameters in mm.
- A vacuum line is a wire with `"kind": "tube"`, `tubeInner` and `tubeOuter` (mm), `tubeMaterial` (`silicone`, `epdm`, `nbr`, `fkm`, `pa`, `pu` or `pvc`), `color` (the color codes, and `CL` for clear) and `pricePerMeter`.
- A vacuum tee is a splitter with `"style": "manifold"`.
- A connector can have `"shape": "pump"` or `"shape": "cup"`. Then the drawing shows a pump or a suction cup in its middle.
- A flat cable is a wire with `"kind": "flat"`, `flatUse` (`CSI` or `DSI`), `flatA` and `flatB` (`15` or `22`) and `price`.
- The `version` number shows the format version. This version of OpenWire opens version 1.

For a full example, refer to [examples/tail-lamp-harness.openwire.json](examples/tail-lamp-harness.openwire.json).

## Run OpenWire on your computer

OpenWire has no build step and no dependencies. It uses JavaScript modules. Browsers do not load modules from a `file://` address, so use a local web server:

```sh
cd OpenWire
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Project structure

```text
index.html         The page
favicon.svg        The icon
css/themes.css     Colors of each theme, for the app and the drawing
css/style.css      Styles of the app, and print
js/app.js          Commands, menu, keyboard, files and start
js/model.js        Data, cut list, BOM and checks (no browser code)
js/store.js        Project, selection, undo and redo
js/canvas.js       Drawing area, mouse and touch input, SVG export
js/layout.js       Size of the components and position of the pins
js/draw.js         Graphics of components, connector types, wires and cables
js/version.js      Version number
js/themes.js       Theme menu and the saved theme
js/schematics.js   Schematics tab
js/zip.js          Read and write ZIP files (no other libraries)
js/inspector.js    Properties tab
js/tables.js       Cut list, BOM and Checks tabs
js/report.js       Table data, CSV and HTML tables
js/images.js       Read pictures, make them smaller, turn and crop them
js/crop.js         Crop window
js/files.js        Open, save, download and the draft copy
examples/          Example project
fonts/             Barlow Semi Condensed font
```

## Possible next work

- A library of the connectors and wires that you use frequently.
- A physical layout view with branches and real lengths.
- A direct PDF export, for example with svg2pdf.js and jsPDF.
- Splices, shields and twisted pairs.

## License

The OpenWire code uses the MIT License. Refer to [LICENSE](LICENSE).

The font Barlow Semi Condensed uses the SIL Open Font License 1.1. Refer to [fonts/OFL.txt](fonts/OFL.txt).

The Catppuccin colors come from [Catppuccin](https://catppuccin.com) (MIT License). The VS Code colors come from the Dark Modern, Dark+ and Light Modern themes of Visual Studio Code.
