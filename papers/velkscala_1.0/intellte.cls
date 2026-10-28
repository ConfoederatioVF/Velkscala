%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% intellte.cls — Confoederatio, Research Division (CRD)
% Single-column working paper class for core/rticles/intellte/
% Header/Title/Subtitle font: Jost* | Banner/Labels: Karla | Body: Source Serif 4
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{intellte}[2026/10/28 v2.0 Intellte CRD Working Paper Class]

\DeclareOption{twocolumn}{} % Enforce 1-column layout for CRD working papers
\DeclareOption{twoside}{}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{extarticle}}
\ProcessOptions*
\LoadClass[10pt,onecolumn]{extarticle}

%% Engine detection & typography (Jost* headers, Karla banner/labels, Source Serif 4 body)
\RequirePackage{iftex}
\RequirePackage[english]{babel}
\RequirePackage{amsmath,amsfonts,amssymb}

\newcommand{\crd@fontpath}{../../../core/rticles/intellte/resources/fonts/}
\IfFileExists{../../../core/rticles/intellte/resources/fonts/Jost-400-Book.otf}{%
  \renewcommand{\crd@fontpath}{../../../core/rticles/intellte/resources/fonts/}%
}{%
  \IfFileExists{../../core/rticles/intellte/resources/fonts/Jost-400-Book.otf}{%
    \renewcommand{\crd@fontpath}{../../core/rticles/intellte/resources/fonts/}%
  }{%
    \IfFileExists{../resources/fonts/Jost-400-Book.otf}{%
      \renewcommand{\crd@fontpath}{../resources/fonts/}%
    }{%
      \IfFileExists{fonts/Jost-400-Book.otf}{%
        \renewcommand{\crd@fontpath}{fonts/}%
      }{}%
    }%
  }%
}

\newcommand{\crd@logopath}{../../../core/rticles/intellte/resources/crd_logo.png}
\IfFileExists{../../../core/rticles/intellte/resources/crd_logo.png}{%
  \renewcommand{\crd@logopath}{../../../core/rticles/intellte/resources/crd_logo.png}%
}{%
  \IfFileExists{../../core/rticles/intellte/resources/crd_logo.png}{%
    \renewcommand{\crd@logopath}{../../core/rticles/intellte/resources/crd_logo.png}%
  }{%
    \IfFileExists{../resources/crd_logo.png}{%
      \renewcommand{\crd@logopath}{../resources/crd_logo.png}%
    }{%
      \IfFileExists{crd_logo.png}{%
        \renewcommand{\crd@logopath}{crd_logo.png}%
      }{}%
    }%
  }%
}

\iftutex
  \RequirePackage{fontspec}
  \defaultfontfeatures{Ligatures=TeX}
  \setmainfont{SourceSerif4}[
    Path = \crd@fontpath,
    Extension = .otf,
    UprightFont = *-Regular,
    ItalicFont = *-It,
    BoldFont = *-Bold,
    BoldItalicFont = *-BoldIt
  ]
  \setsansfont{Jost}[
    Path = \crd@fontpath,
    Extension = .otf,
    UprightFont = *-400-Book,
    ItalicFont = *-400-BookItalic,
    BoldFont = *-700-Bold,
    BoldItalicFont = *-700-BoldItalic
  ]
  \newfontfamily\jostlight{Jost}[
    Path = \crd@fontpath,
    Extension = .otf,
    UprightFont = *-300-Light,
    ItalicFont = *-400-BookItalic,
    BoldFont = *-500-Medium,
    BoldItalicFont = *-500-MediumItalic
  ]
  \newfontfamily\jostmedium{Jost}[
    Path = \crd@fontpath,
    Extension = .otf,
    UprightFont = *-500-Medium,
    ItalicFont = *-500-MediumItalic,
    BoldFont = *-700-Bold,
    BoldItalicFont = *-700-BoldItalic
  ]
  \newfontfamily\jostsemibold{Jost}[
    Path = \crd@fontpath,
    Extension = .otf,
    UprightFont = *-600-Semi,
    ItalicFont = *-600-SemiItalic,
    BoldFont = *-700-Bold,
    BoldItalicFont = *-700-BoldItalic
  ]
  \newfontfamily\karlafont{Karla}[
    Path = \crd@fontpath,
    Extension = .ttf,
    UprightFont = *-Regular,
    ItalicFont = *-Italic,
    BoldFont = *-Bold,
    BoldItalicFont = *-BoldItalic
  ]
  \newfontfamily\karlalightfont{Karla}[
    Path = \crd@fontpath,
    Extension = .ttf,
    UprightFont = *-Light,
    ItalicFont = *-LightItalic,
    BoldFont = *-Regular,
    BoldItalicFont = *-Italic
  ]
  \newcommand{\karlalight}{\karlalightfont\mdseries}
  \newcommand{\karlaregular}{\karlafont\mdseries}
  \newcommand{\karlabold}{\karlafont\bfseries}
\else
  \RequirePackage[utf8]{inputenc}
  \RequirePackage[T1]{fontenc}
  \RequirePackage{lmodern}
  \RequirePackage[scaled]{helvet}
  \newcommand{\jostlight}{\sffamily}
  \newcommand{\jostmedium}{\sffamily}
  \newcommand{\jostsemibold}{\sffamily\bfseries}
  \newcommand{\karlafont}{\sffamily}
  \newcommand{\karlalight}{\sffamily\mdseries}
  \newcommand{\karlaregular}{\sffamily\mdseries}
  \newcommand{\karlabold}{\sffamily\bfseries}
\fi

\RequirePackage{lettrine}
\RequirePackage{afterpage}
\RequirePackage{xcolor}
\RequirePackage{tikz}
\RequirePackage{graphicx}
\RequirePackage{colortbl}
\RequirePackage{booktabs}
\RequirePackage{algorithm}
\RequirePackage[noend]{algpseudocode}
\RequirePackage{changepage}
\RequirePackage{etoolbox}
\RequirePackage{enumitem}
\RequirePackage{float}
\RequirePackage{placeins}
\RequirePackage[normalem]{ulem}

%% Single-column Intellte CRD page geometry (0.5in top/bottom, 1in left/right)
\RequirePackage[
  letterpaper,
  onecolumn,
  left=1in,
  right=1in,
  top=0.5in,
  bottom=0.5in,
  headheight=0pt,
  headsep=0pt,
  footskip=0pt
]{geometry}

%% Suppress page numbers across all pages (online PDF readers display page numbers natively)
\pagestyle{empty}

%% Document colour palette
\definecolor{black50}{gray}{0.5}
\definecolor{color0}{RGB}{0,0,0}
\definecolor{crdmeta}{RGB}{45,45,45}
\definecolor{crdlinkblue}{RGB}{29,78,216}

%% Hyperlinking
\RequirePackage[
  colorlinks=true,
  linkcolor=crdlinkblue,
  citecolor=crdlinkblue,
  urlcolor=crdlinkblue
]{hyperref}
\renewcommand\UrlFont{\normalfont\rmfamily\mdseries\color{crdlinkblue}}
\AtBeginDocument{%
  \setlength{\ULdepth}{1.5pt}%
  \let\crd@orig@hyper@linkurl\hyper@linkurl
  \def\hyper@linkurl#1#2{\crd@orig@hyper@linkurl{\uline{#1}}{#2}}%
}

%% Paragraph & body text formatting (Source Serif 4, 10pt on 15pt leading, unbolded, left-aligned)
\renewcommand{\normalsize}{\@setfontsize\normalsize{10pt}{15pt}}
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt plus 1pt minus 1pt}
\setlist[itemize]{itemsep=2pt, parsep=2pt, topsep=3pt}
\AtBeginDocument{%
  \thispagestyle{empty}%
  \pagestyle{empty}%
  \normalsize\normalfont\rmfamily\mdseries
  \raggedright
  \hyphenpenalty=10000
  \exhyphenpenalty=10000
}

%% Font helper macros
%% - Confoederatio, Research Division (CRD) banner: Karla Bold
%% - Title, Subtitle & Section headers: Jost*
%% - Authors/date/emails byline: Karla Light
%% - Figure n. / Table n. / Image n. / Definition n.: Karla Bold
%% - Body, Abstract, Sources & Footnotes: Source Serif 4
\newcommand{\headerfont}{\normalfont\karlaregular\fontsize{8.5pt}{11pt}\selectfont}
\newcommand{\footerfont}{\normalfont\karlaregular\fontsize{8.5pt}{11pt}\selectfont}
\newcommand{\crdbannerfont}{\normalfont\karlabold\fontsize{14.5pt}{18.5pt}\selectfont}
\newcommand{\titlefont}{\normalfont\sffamily\bfseries\fontsize{20pt}{24pt}\selectfont}
\newcommand{\subtitlefont}{\normalfont\sffamily\mdseries\fontsize{14.5pt}{19pt}\selectfont}
\newcommand{\datesfont}{\normalfont\karlalight\fontsize{11pt}{15.5pt}\selectfont}
\newcommand{\absfont}{\normalfont\rmfamily\mdseries\fontsize{10pt}{15pt}\selectfont}
\newcommand{\dropcapfont}{\normalfont\sffamily\bfseries\fontsize{24pt}{26pt}\selectfont}

\RequirePackage{authblk}
\RequirePackage{xifthen}
\newboolean{shortarticle}
\setboolean{shortarticle}{false}
\newboolean{singlecolumn}
\setboolean{singlecolumn}{true}
\newboolean{displaywatermark}
\setboolean{displaywatermark}{false}
\newboolean{displaycopyright}
\setboolean{displaycopyright}{false}

\newcommand\numberthis{\addtocounter{equation}{1}\tag{\theequation}}

%% Captions & Numbered Labels:
%% - Always underneath figure/table/image
%% - Always centred
%% - Double line breaks above and below captions (aboveskip=18pt, belowskip=18pt)
%% - Label (Figure n., Table n., Image n., Definition n.) in Karla Bold, inline with Source Serif 4 caption text
\RequirePackage{caption}
\DeclareCaptionFormat{crdformat}{\centering\normalfont\rmfamily\mdseries\fontsize{10pt}{15pt}\selectfont{\karlabold #1#2}#3\par}
\captionsetup{
  format=crdformat,
  labelsep=period,
  figurename=Figure,
  tablename=Table,
  singlelinecheck=true,
  justification=centering,
  position=below,
  aboveskip=18pt,
  belowskip=18pt,
  skip=18pt
}
\captionsetup[figure]{position=below, justification=centering, aboveskip=18pt, belowskip=18pt, skip=18pt}
\captionsetup[table]{position=below, justification=centering, aboveskip=18pt, belowskip=18pt, skip=18pt}

%% Image n. and Definition n. environments using Karla Bold labels inline with Source Serif 4
\DeclareCaptionType[fileext=loi,placement={!htbp},within=none]{crdimage}[Image][List of Images]
\captionsetup[crdimage]{position=below,format=crdformat,labelsep=period,name=Image,justification=centering,aboveskip=18pt,belowskip=18pt,skip=18pt}

\newcounter{crddefinition}
\newenvironment{definition}[1][]{%
  \refstepcounter{crddefinition}%
  \par\vspace{4pt}\noindent
  {\karlabold Definition \thecrddefinition\ifx&#1&\else\ (#1)\fi.}\hspace{0.4em}%
  \normalfont\rmfamily\mdseries\ignorespaces
}{\par\vspace{4pt}}

%% Section, subsection, and subsubsection headings in Jost*
\RequirePackage[explicit]{titlesec}
\setcounter{secnumdepth}{3}

\titleformat{\section}
  {\normalfont\sffamily\bfseries\fontsize{14pt}{18pt}\selectfont}
  {\thesection.}
  {0.5em}
  {#1}
  []
\titleformat{name=\section,numberless}
  {\normalfont\sffamily\bfseries\fontsize{14pt}{18pt}\selectfont}
  {}
  {0em}
  {#1}
  []
\titleformat{\subsection}
  {\normalfont\sffamily\bfseries\fontsize{11.5pt}{15.5pt}\selectfont}
  {\thesubsection.}
  {0.5em}
  {#1}
  []
\titleformat{name=\subsection,numberless}
  {\normalfont\sffamily\bfseries\fontsize{11.5pt}{15.5pt}\selectfont}
  {}
  {0em}
  {#1}
  []
\titleformat{\subsubsection}
  {\normalfont\sffamily\bfseries\fontsize{10.5pt}{14pt}\selectfont}
  {\thesubsubsection.}
  {0.5em}
  {#1}
  []
\titleformat{name=\subsubsection,numberless}
  {\normalfont\sffamily\bfseries\fontsize{10.5pt}{14pt}\selectfont}
  {}
  {0em}
  {#1}
  []
\titleformat{\paragraph}[runin]
  {\normalfont\sffamily\bfseries\fontsize{10pt}{14pt}\selectfont}
  {}
  {0em}
  {#1}
  []

\titlespacing*{\section}{0pt}{14pt plus 2pt minus 2pt}{6pt}
\titlespacing*{\subsection}{0pt}{10pt plus 2pt minus 1pt}{4pt}
\titlespacing*{\subsubsection}{0pt}{8pt plus 2pt minus 1pt}{2pt}
\titlespacing*{\paragraph}{0pt}{5pt plus 1pt minus 1pt}{8pt}

%% Metadata macros
\newcommand{\subtitle}[1]{\def\@subtitle{#1}}
\newcommand{\crddate}[1]{\def\@crddate{#1}}
\newcommand{\crdauthors}[1]{\def\@crdauthors{#1}}
\newcommand{\crdemails}[1]{\def\@crdemails{#1}}
\newcommand{\herofigure}[1]{\def\@herofigure{#1}}
\newcommand{\herocaption}[1]{\def\@herocaption{#1}}
\newcommand{\herolabel}[1]{\def\@herolabel{#1}}

\newcommand{\dropcap}[1]{\lettrine[lines=2,lraise=0.05,findent=0.1em,nindent=0em]{{\dropcapfont{#1}}}{}}

%% Abstract environment (unbolded Source Serif 4 under Jost* Abstract heading)
\def\xabstract{abstract}
\long\def\abstract#1\end#2{\def\two{#2}\ifx\two\xabstract
\long\gdef\theabstract{\ignorespaces#1}
\def\go{\end{abstract}}\else
#1\end{#2}\let\go\relax\fi
\go}

\newcommand{\abscontent}{%
  \@ifundefined{theabstract}{}{%
    \par\vspace{4pt}%
    {\normalfont\sffamily\bfseries\fontsize{14pt}{18pt}\selectfont Abstract\par}%
    \vspace{4pt}%
    {\noindent\absfont\theabstract\par}%
    \vspace{8pt}%
  }%
}
\newcommand{\abscontentformatted}{\abscontent}

%% Intellte CRD Working Paper Title Block
\renewcommand{\@maketitle}{%
  \noindent
  \begin{minipage}{\textwidth}
    \raggedright
    % 1. Top CRD Flag + CONFOEDERATIO, RESEARCH DIVISION (CRD). Banner
    % CRD 2026 logo aspect ratio is 512x464: optically aligned to the combined line height (37pt) of the two 18.5pt rows
    \noindent
    \IfFileExists{\crd@logopath}{%
      \noindent\raisebox{-3.5pt}{\includegraphics[height=37pt]{\crd@logopath}}\hspace{10pt}%
      \parbox[b]{0.80\textwidth}{%
        \crdbannerfont CONFOEDERATIO,\par\vspace{2pt}%
        \crdbannerfont RESEARCH DIVISION (CRD).%
      }\par
    }{%
      {\crdbannerfont CONFOEDERATIO,\par RESEARCH DIVISION (CRD).\par}%
    }%
    \vspace{12pt}%
    % 2. Main Title (Jost* Bold Uppercase)
    {\raggedright\titlefont\MakeUppercase{\@title}\par}%
    % 3. Subtitle (Jost* Book)
    \@ifundefined{@subtitle}{}{%
      \vspace{5pt}%
      {\raggedright\subtitlefont\@subtitle\par}%
    }%
    % 4. Date - Authors | Emails line (Karla Light)
    \vspace{4pt}%
    {\raggedright\datesfont\color{crdmeta}%
      \renewcommand\UrlFont{\karlalight\fontsize{11pt}{15.5pt}\selectfont\color{crdlinkblue}}%
      \@ifundefined{@crddate}{\today}{\@crddate}%
      \@ifundefined{@crdauthors}{}{ - \@crdauthors}%
      \@ifundefined{@crdemails}{}{ \textbar\ \@crdemails}%
      \par}%
    \vspace{4pt}%
  \end{minipage}\par
  % 5. Optional Hero Figure (Cover chart before Abstract: full-width 0in left/right margins = \paperwidth)
  \@ifundefined{@herofigure}{}{%
    \noindent
    \begin{minipage}{\textwidth}
      \centering
      \noindent\makebox[\textwidth][c]{\includegraphics[width=\paperwidth]{\@herofigure}}\par
      \captionsetup{type=figure, aboveskip=15pt, belowskip=6pt, skip=15pt}%
      \@ifundefined{@herocaption}{}{%
        \expandafter\caption\expandafter{\@herocaption}%
        \@ifundefined{@herolabel}{}{\expandafter\label\expandafter{\@herolabel}}%
      }%
    \end{minipage}\par
  }%
  % 6. Unbolded Abstract section (if provided in YAML frontmatter; otherwise # Abstract section in body)
  \abscontent
}

%% CRD Endnotes ("Footnotes" section at the end of the paper after Sources)
%% Matches CRD convention:
%% - Inline \footnote{...} (or Markdown ^[...]) places a hyperlinked superscript number
%% - \printcrdfootnotes renders the horizontal separator rule under the "Footnotes" heading
%%   followed by flush-left superscripted endnotes in 10pt/15pt Source Serif 4
\newcounter{crdfootnote}
\newcommand{\crd@fnlist}{}

\long\def\footnote#1{%
  \refstepcounter{crdfootnote}%
  \hyperlink{crdfn:\thecrdfootnote}{\textsuperscript{\thecrdfootnote}}%
  \begingroup
    \edef\crd@currfn{\thecrdfootnote}%
    \expandafter\crd@appendfn\expandafter{\crd@currfn}{#1}%
  \endgroup
}

\long\def\crd@appendfn#1#2{%
  \gappto\crd@fnlist{%
    \par\noindent\hypertarget{crdfn:#1}{\textsuperscript{#1}}\hspace{0.22em}#2\par\vspace{8pt}%
  }%
}

\newcommand{\printcrdfootnotes}{%
  \par\setlength{\parskip}{0pt}\vspace{-2pt}%
  \noindent{\color{crdmeta}\rule{0.32\textwidth}{0.5pt}}\par
  {\normalfont\rmfamily\mdseries\fontsize{10pt}{15pt}\selectfont\raggedright
   \setlength{\parskip}{0pt}%
   \crd@fnlist
   \par}%
}

\endinput

