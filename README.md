# OpenWire

OpenWire is a free, open-source tool to draw wire harnesses. It operates in your web browser. You draw the connectors and the wires. OpenWire makes the cut list and the bill of materials (BOM) for you.

**Open OpenWire:** <https://manos-g.github.io/OpenWire/>

> **NOTE:** This link operates after you publish the site. Refer to [Publish OpenWire on GitHub Pages](#publish-openwire-on-github-pages).

## What OpenWire does

- Add connectors with pin names, part numbers and prices.
- Draw wires from pin to pin with a mouse, a pen or a finger.
- Give each wire a color, a stripe, a gauge and a length. The colors use the IEC 60757 codes, for example BK, RD and GN.
- See the cut list. OpenWire adds an extra length to each wire. You need this length to strip and crimp the wire.
- See the bill of materials. OpenWire puts the parts with the same part number on one line.
- Add a photo to each connector. The photo shows in the drawing and in the printout.
- Put a background picture behind the harness, for example a photo of the vehicle or the panel.
- Find problems in the **Checks** tab, for example a wire without a length.
- Undo and redo all changes.
- Save the project as a file on your computer. Open the file again at a later time.
- Export the drawing as an SVG file. The SVG file also contains the project, so OpenWire can open it again.
- Download the cut list and the BOM as CSV files for a spreadsheet.
- Print the drawing, the cut list and the BOM. Or save them as a PDF file.
- Use OpenWire on a computer, a tablet or a phone, with a light theme or a dark theme.

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

1. Click **Add connector**.
2. In the **Properties** tab, type the name, the number of pins and the part number.
3. Type a name for each pin.

To move a connector, drag its dark bar.

### Add a wire

Use one of these procedures:

- Drag from a pin to a different pin.
- Click one pin. Then click the other pin. On a touch screen, touch the two pins.

A new wire has no length. Type the length in the **Properties** tab. The new wire gets the color, the stripe and the gauge of the last wire.

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

The photo shows below the pins of the connector. To move the connector, you can also drag its photo.

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

### Save and open files

- To save, click **File** > **Save**, or push Ctrl+S.
- To open a file, click **File** > **Open**, or push Ctrl+O. You can also drag a file into the window.
- OpenWire opens `.openwire.json` files and the SVG files that it exported.

### Print or save as PDF

1. Click **File** > **Print or save as PDF**.
2. In the print window, select **Save as PDF** as the printer. Or select a printer.

The drawing is on the first page. The cut list and the BOM are on the next pages.

## Keyboard shortcuts

| Action | Windows and Linux | Mac |
| --- | --- | --- |
| Save | Ctrl+S | ⌘S |
| Save as | Ctrl+Shift+S | ⇧⌘S |
| Open | Ctrl+O | ⌘O |
| Undo | Ctrl+Z | ⌘Z |
| Redo | Ctrl+Shift+Z or Ctrl+Y | ⇧⌘Z or ⌘Y |
| Duplicate the connector | Ctrl+D | ⌘D |
| Delete the selected item | Delete or Backspace | Delete |
| Stop a wire, or clear the selection | Esc | Esc |
| Zoom in or zoom out | + or − | + or − |
| Show the full drawing | F | F |

To move the drawing, drag the background, or scroll. To zoom, push Ctrl and scroll. On a touch screen, pinch with two fingers to zoom.

## Browser support

| Browser | What Save does |
| --- | --- |
| Chrome, Edge and Opera on a computer | OpenWire saves to the same file again. The browser can ask for permission. |
| Firefox and Safari | The browser downloads a new copy each time. It can add a number to the name, for example `harness (1).openwire.json`. |
| Phones and tablets | The browser downloads a new copy each time. |

## File format

OpenWire saves projects as JSON text. You can compare two versions of a file in Git.

```json
{
  "format": "openwire",
  "version": 1,
  "meta": { "name": "Tail lamp harness", "author": "", "revision": "A" },
  "settings": { "cutMargin": 20, "currency": "€" },
  "connectors": [
    { "id": "c-x1", "ref": "X1", "x": 0, "y": 40, "partNumber": "DT06-08SA", "pins": [{ "label": "GND" }] }
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

- Pin numbers start at 1.
- Lengths are in millimeters.
- The `images` part contains the pictures as text (data URLs). A connector refers to its photo with the `image` field. The `background` part refers to the background picture.
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
css/style.css      Styles: light theme, dark theme and print
js/app.js          Commands, menu, keyboard, files and start
js/model.js        Data, cut list, BOM and checks (no browser code)
js/store.js        Project, selection, undo and redo
js/canvas.js       SVG drawing, mouse and touch input, SVG export
js/inspector.js    Properties tab
js/tables.js       Cut list, BOM and Checks tabs
js/report.js       Table data, CSV and HTML tables
js/images.js       Read pictures, make them smaller, show them
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
