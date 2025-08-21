# Antique Bidderly Academic Poster

This repository contains LaTeX source files for creating an academic poster showcasing the Antique Bidderly auction platform.

## Files Included

1. **`auction_poster.tex`** - Advanced poster using baposter package
2. **`auction_poster_simple.tex`** - Simplified poster using standard LaTeX packages
3. **`POSTER_README.md`** - This instruction file

## Prerequisites

### For Simple Poster (`auction_poster_simple.tex`)
- Any LaTeX distribution (TeX Live, MiKTeX, etc.)
- Standard packages (should be included with most distributions)

### For Advanced Poster (`auction_poster.tex`)
- LaTeX distribution
- baposter package (may need to be installed separately)

## Compilation Instructions

### Method 1: Simple Poster (Recommended)
```bash
pdflatex auction_poster_simple.tex
```

### Method 2: Advanced Poster
```bash
pdflatex auction_poster.tex
```

## Poster Dimensions

The poster is designed with a **4:10 aspect ratio** (width:height):
- **Width**: 400mm
- **Height**: 1000mm
- **Ratio**: 4:10 (narrow and tall format)

This format is ideal for:
- Academic presentations
- Conference posters
- Display on narrow walls or pillars
- Easy reading from a distance

## Customization Options

### 1. Change Colors
Modify the color definitions in the preamble:
```latex
\definecolor{lightblue}{RGB}{173,216,230}
\definecolor{darkblue}{RGB}{0,51,102}
\definecolor{gold}{RGB}{255,215,0}
```

### 2. Update Personal Information
Change the author name and details:
```latex
\textcolor{white}{\Large\textbf{Your Name}} \\
\textcolor{white}{\normalsize Your Degree - Your Student ID}
```

### 3. Modify Content
- Update the introduction text
- Modify the problem statement
- Adjust the technical stack details
- Update the conclusion

### 4. Add Images
To include screenshots or logos:
1. Create an `images/` folder
2. Add your image files
3. Reference them in the LaTeX file:
```latex
\includegraphics[height=0.15\textheight]{your_image.png}
```

## Poster Structure

The poster follows the academic poster format with a **2-column layout** optimized for the 4:10 aspect ratio:

### Header Section
- Project title: "Antique Bidderly"
- Author information
- University branding space

### Main Content (2 columns)
1. **Introduction** - Project overview
2. **Problem Statement** - Issues addressed
3. **Purpose** - Project objectives
4. **Implementation** - Technical details
5. **How it works** - System workflow
6. **Technical Stack** - Technologies used
7. **Key Features** - System capabilities
8. **Conclusion** - Results and future plans

### Footer Section
- Branding and tagline
- Space for screenshots

## Design Features

- **Aspect Ratio**: 4:10 (narrow and tall)
- **Color Scheme**: Light blue background with dark blue accents
- **Layout**: 2-column grid layout optimized for tall format
- **Typography**: Clear hierarchy with different font sizes
- **Boxes**: Rounded corners with borders
- **Professional**: Academic poster standard format

## Tips for Printing

1. **Size**: The poster is designed for 400mm × 1000mm (4:10 ratio)
2. **Resolution**: Compile to PDF for high-quality printing
3. **Colors**: Test print in grayscale to ensure readability
4. **Fonts**: Use standard fonts for compatibility
5. **Display**: Ideal for narrow walls or pillar displays

## Troubleshooting

### Common Issues

1. **Missing Packages**
   - Install required LaTeX packages
   - Use the simple version if baposter is not available

2. **Compilation Errors**
   - Check for syntax errors
   - Ensure all packages are installed
   - Use UTF-8 encoding

3. **Layout Issues**
   - Adjust box heights if content is too long/short
   - Modify spacing between elements
   - Check page margins

4. **Aspect Ratio Issues**
   - Ensure your PDF viewer respects the custom page size
   - Some printers may need manual size specification
   - Verify the 4:10 ratio is maintained in final output

## Customization Examples

### Change Project Title
```latex
\textcolor{white}{\Huge\textbf{Your Project Name}}
```

### Update Technical Stack
```latex
\textbf{Frontend Technologies:}
\begin{itemize}[leftmargin=*]
\item Your Technology 1
\item Your Technology 2
\end{itemize}
```

### Modify Colors
```latex
\definecolor{yourcolor}{RGB}{R,G,B}
```

### Adjust Dimensions
```latex
\geometry{
  paperwidth=400mm,  % 4 units wide
  paperheight=1000mm, % 10 units high (4:10 ratio)
  margin=15mm
}
```

## Support

If you encounter issues:
1. Check LaTeX compilation logs
2. Verify all packages are installed
3. Use the simple version as a fallback
4. Ensure proper file encoding (UTF-8)
5. Verify your PDF viewer supports custom page sizes

## License

This poster template is provided for academic use. Feel free to modify and adapt for your own projects.
