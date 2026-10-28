%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% pnas-new.cls — Confoederatio, Research Division (CRD)
% Single-column working paper class for core/rticles/intellte/
% Header font: Jost* | Body font: Source Serif 4
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{pnas-new}[2026/10/28 v2.0 CRD Working Paper Class]

\newif\if@pnaslineno
\DeclareOption{lineno}{\@pnaslinenotrue}
\DeclareOption{twocolumn}{} % Enforce 1-column layout for CRD working papers
\DeclareOption{twoside}{}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{extarticle}}
\ProcessOptions*
\LoadClass[10pt,onecolumn]{extarticle}

%% Engine detection & typography (Jost* headers, Source Serif 4 body)
\RequirePackage{iftex}
\RequirePackage[english]{babel}
\RequirePackage{amsmath,amsfonts,amssymb}

\newcommand{\crd@fontpath}{../../core/rticles/intellte/resources/fonts/}
\IfFileExists{../../core/rticles/intellte/resources/fonts/Jost-400-Book.otf}{%
  \renewcommand{\crd@fontpath}{../../core/rticles/intellte/resources/fonts/}%
}{%
  \IfFileExists{fonts/Jost-400-Book.otf}{%
    \renewcommand{\crd@fontpath}{fonts/}%
  }{}%
}

\newcommand{\crd@logopath}{../../core/rticles/intellte/resources/crd_logo.png}
\IfFileExists{../../core/rticles/intellte/resources/crd_logo.png}{%
  \renewcommand{\crd@logopath}{../../core/rticles/intellte/resources/crd_logo.png}%
}{%
  \IfFileExists{crd_logo.png}{%
    \renewcommand{\crd@logopath}{crd_logo.png}%
  }{}%
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

%% Single-column CRD page geometry
\RequirePackage[
  letterpaper,
  onecolumn,
  left=1.08in,
  right=1.08in,
  top=0.78in,
  bottom=0.82in,
  headheight=0pt,
  headsep=0pt,
  footskip=26pt
]{geometry}

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
\renewcommand\UrlFont{\karlaregular\color{crdlinkblue}}
\AtBeginDocument{%
  \let\crd@orig@nolinkurl\nolinkurl
  \renewcommand{\nolinkurl}[1]{\textcolor{crdlinkblue}{\underline{\crd@orig@nolinkurl{#1}}}}%
}

%% Paragraph & body text formatting (Source Serif 4, unbolded)
\setlength{\parindent}{0pt}
\setlength{\parskip}{4.5pt plus 1pt minus 1pt}
\setlist[itemize]{itemsep=1pt, parsep=1.5pt, topsep=2pt}
\AtBeginDocument{%
  \normalfont\rmfamily\mdseries\fontsize{10pt}{14.4pt}\selectfont
}

%% Font helper macros
%% - Confoederatio, Research Division (CRD) banner: Karla Bold
%% - Title & Section headers: Jost*
%% - Authors/date subtitle line & Figure n. / Table n. / Image n. / Definition n.: Karla
%% - Body & Abstract: Source Serif 4
\newcommand{\headerfont}{\normalfont\karlaregular\fontsize{8.5pt}{11pt}\selectfont}
\newcommand{\footerfont}{\normalfont\karlaregular\fontsize{8.5pt}{11pt}\selectfont}
\newcommand{\crdbannerfont}{\normalfont\karlabold\fontsize{14pt}{17pt}\selectfont}
\newcommand{\titlefont}{\normalfont\sffamily\bfseries\fontsize{18.5pt}{22.5pt}\selectfont}
\newcommand{\subtitlefont}{\normalfont\sffamily\mdseries\fontsize{13pt}{17pt}\selectfont}
\newcommand{\datesfont}{\normalfont\karlaregular\fontsize{9.5pt}{13.5pt}\selectfont}
\newcommand{\absfont}{\normalfont\rmfamily\mdseries\fontsize{10pt}{15pt}\selectfont}
\newcommand{\dropcapfont}{\normalfont\sffamily\bfseries\fontsize{24pt}{26pt}\selectfont}

%% Author and affiliation compatibility macros
\RequirePackage{authblk}
\newcommand*{\templatetype}[1]{\RequirePackage{#1}}
\RequirePackage{xifthen}
\newboolean{shortarticle}
\setboolean{shortarticle}{false}
\newboolean{singlecolumn}
\setboolean{singlecolumn}{true}

%% Watermark disabled (No DRAFT watermark in CRD working papers)
\newboolean{displaywatermark}
\setboolean{displaywatermark}{false}
\newboolean{displaycopyright}
\setboolean{displaycopyright}{false}

\newcommand\numberthis{\addtocounter{equation}{1}\tag{\theequation}}

%% Captions & Numbered Labels: Figure n., Table n., Image n., Definition n. bolded in Karla and inline with Source Serif 4 caption
\RequirePackage{caption}
\DeclareCaptionFormat{crdformat}{\normalfont\rmfamily\mdseries\fontsize{9.5pt}{13.5pt}\selectfont{\karlabold #1#2}#3\par}
\captionsetup{
  format=crdformat,
  labelsep=period,
  figurename=Figure,
  tablename=Table,
  singlelinecheck=true,
  justification=justified,
  skip=6pt
}
\captionsetup[figure]{position=below}
\captionsetup[table]{position=above, singlelinecheck=false, justification=raggedright}

%% Image n. and Definition n. environments using Karla Bold labels inline with Source Serif 4
\DeclareCaptionType[fileext=loi,placement={!htbp},within=none]{crdimage}[Image][List of Images]
\captionsetup[crdimage]{position=below,format=crdformat,labelsep=period,name=Image}

\newcounter{crddefinition}
\newenvironment{definition}[1][]{%
  \refstepcounter{crddefinition}%
  \par\vspace{4pt}\noindent
  {\karlabold Definition \thecrddefinition\ifx&#1&\else\ (#1)\fi.}\hspace{0.4em}%
  \normalfont\rmfamily\mdseries\ignorespaces
}{\par\vspace{4pt}}

%% Table rules and typography
\setlength{\heavyrulewidth}{0.6pt}
\setlength{\lightrulewidth}{0.4pt}
\setlength{\aboverulesep}{1.8pt}
\setlength{\belowrulesep}{1.8pt}
\setlength{\belowbottomsep}{6pt}
\newcommand{\addtabletext}[1]{{\setlength{\leftskip}{0pt}\fontsize{8pt}{10.5pt}\selectfont#1}}

%% Headers and footers (Clean CRD page numbering, no PNAS footer)
\RequirePackage{fancyhdr}
\RequirePackage{lastpage}
\pagestyle{fancy}
\fancyhf{}
\fancyfoot[R]{\footerfont\color{crdmeta}\thepage}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\fancypagestyle{firststyle}{
  \fancyhf{}
  \renewcommand{\headrulewidth}{0pt}
  \renewcommand{\footrulewidth}{0pt}
}

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

\titlespacing*{\section}{0pt}{13pt plus 2pt minus 2pt}{5pt}
\titlespacing*{\subsection}{0pt}{10pt plus 2pt minus 1pt}{3pt}
\titlespacing*{\subsubsection}{0pt}{8pt plus 2pt minus 1pt}{2pt}
\titlespacing*{\paragraph}{0pt}{5pt plus 1pt minus 1pt}{8pt}

%% Metadata macros
\newcommand{\additionalelement}[1]{\def\@additionalelement{#1}}
\newcommand{\subtitle}[1]{\def\@subtitle{#1}}
\newcommand{\crddate}[1]{\def\@crddate{#1}}
\newcommand{\crdauthors}[1]{\def\@crdauthors{#1}}
\newcommand{\crdemails}[1]{\def\@crdemails{#1}}
\newcommand{\herofigure}[1]{\def\@herofigure{#1}}
\newcommand{\herocaption}[1]{\def\@herocaption{#1}}
\newcommand{\herolabel}[1]{\def\@herolabel{#1}}
\newcommand{\dates}[1]{\def\@dates{#1}}
\newcommand{\doi}[1]{\def\@doi{#1}}
\newcommand{\leadauthor}[1]{\def\@leadauthor{#1}}
\newcommand{\etal}[1]{\def\@etal{#1}}
\newcommand{\keywords}[1]{\def\@keywords{#1}}
\newcommand{\authorcontributions}[1]{\def\@authorcontributions{#1}}
\newcommand{\authordeclaration}[1]{\def\@authordeclaration{#1}}
\newcommand{\equalauthors}[1]{\def\@equalauthors{#1}}
\newcommand{\correspondingauthor}[1]{\def\@correspondingauthor{#1}}
\newcommand{\significancestatement}[1]{\def\@significancestatement{#1}}
\newcommand{\matmethods}[1]{\def\@matmethods{#1}}
\newcommand{\acknow}[1]{\def\@acknow{#1}}

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
    \par\vspace{8pt}%
    {\normalfont\sffamily\bfseries\fontsize{14pt}{18pt}\selectfont Abstract\par}%
    \vspace{6pt}%
    {\noindent\absfont\theabstract\par}%
    \vspace{10pt}%
  }%
}
\newcommand{\abscontentformatted}{\abscontent}

\newlength\pnas@vertadjust
\newcommand\verticaladjustment[1]{\setlength{\pnas@vertadjust}{#1}}

%% CRD Working Paper Title Block (matching Image 1)
\renewcommand{\@maketitle}{%
  \noindent
  \begin{minipage}{\textwidth}
    \raggedright
    % 1. Top CRD Flag + CONFOEDERATIO, RESEARCH DIVISION (CRD). Banner
    \noindent
    \IfFileExists{\crd@logopath}{%
      \parbox[c]{35pt}{\includegraphics[width=35pt,height=34pt]{\crd@logopath}}%
      \hspace{10pt}%
      \parbox[c]{0.82\textwidth}{%
        \crdbannerfont CONFOEDERATIO,\par\vspace{1pt}%
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
    % 4. Date - Authors | Emails line (Jost* Book)
    \vspace{5pt}%
    {\raggedright\datesfont\color{crdmeta}%
      \@ifundefined{@crddate}{\today}{\@crddate}%
      \@ifundefined{@crdauthors}{}{ - \@crdauthors}%
      \@ifundefined{@crdemails}{}{ \textbar\ \@crdemails}%
      \par}%
    \vspace{8pt}%
  \end{minipage}\par
  % 5. Optional Hero Figure (Figure 1 above Abstract, as in Image 1)
  \@ifundefined{@herofigure}{}{%
    \noindent
    \begin{minipage}{\textwidth}
      \centering
      \includegraphics[width=\textwidth,height=0.355\textheight,keepaspectratio]{\@herofigure}%
      \captionsetup{type=figure}%
      \@ifundefined{@herocaption}{}{%
        \expandafter\caption\expandafter{\@herocaption}%
        \@ifundefined{@herolabel}{}{\expandafter\label\expandafter{\@herolabel}}%
      }%
    \end{minipage}\par
    \vspace{4pt}%
  }%
  % 6. Unbolded Abstract section
  \abscontent
}

%% Footnotes
\RequirePackage[flushmargin,ragged]{footmisc}
\renewcommand*{\footnotelayout}{\normalfont\rmfamily\fontsize{8.5pt}{11.5pt}\selectfont}
\renewcommand{\footnoterule}{%
  \kern -3pt
  {\color{black50}\hrule width 72pt height 0.25pt}
  \kern 2.5pt
}

%% Disabled PNAS-specific trailing macros
\newcommand{\showacknow}{}
\newcommand{\showmatmethods}{}
\def\pnasbreak{}

\endinput
