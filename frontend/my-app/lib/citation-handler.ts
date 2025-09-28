import React from 'react';

export interface CitationInfo {
  citationNumber: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedMessage {
  parts: MessagePart[];
  citations: CitationInfo[];
}

export interface MessagePart {
  type: 'text' | 'citation';
  content: string;
  citationNumber?: number;
}

/**
 * Parses chat messages to identify citations in [Document X] format
 * @param message The chat message content
 * @returns Parsed message with identified citations
 */
export function parseCitations(message: string): ParsedMessage {
  // Updated regex to match both "Document" and "Source" patterns for backward compatibility
  const citationRegex = /\[(?:Document|Source) (\d+)\]/g;
  const citations: CitationInfo[] = [];
  const parts: MessagePart[] = [];
  
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(message)) !== null) {
    const citationNumber = parseInt(match[1]);
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    // Add text before citation
    if (startIndex > lastIndex) {
      const textBefore = message.substring(lastIndex, startIndex);
      if (textBefore.trim()) {
        parts.push({
          type: 'text',
          content: textBefore
        });
      }
    }

    // Add citation
    citations.push({
      citationNumber,
      text: match[0],
      startIndex,
      endIndex
    });

    parts.push({
      type: 'citation',
      content: match[0],
      citationNumber
    });

    lastIndex = endIndex;
  }

  // Add remaining text
  if (lastIndex < message.length) {
    const remainingText = message.substring(lastIndex);
    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText
      });
    }
  }

  // If no citations found, return the entire message as text
  if (citations.length === 0) {
    parts.push({
      type: 'text',
      content: message
    });
  }

  return { parts, citations };
}

/**
 * Finds potential anchor targets in HTML content for citations
 * @param htmlContent The HTML content of the paper
 * @param citationNumber The citation number to find
 * @returns Array of potential target elements/sections
 */
export function findCitationTargets(htmlContent: string, citationNumber: number): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const targets: string[] = [];

  // Common patterns to look for citations in academic papers
  const searchPatterns = [
    // Direct reference patterns
    `[${citationNumber}]`,
    `(${citationNumber})`,
    `${citationNumber}.`,
    
    // Section patterns that might contain references
    `Section ${citationNumber}`,
    `section ${citationNumber}`,
    `Chapter ${citationNumber}`,
    `chapter ${citationNumber}`,
    
    // Figure and table patterns
    `Figure ${citationNumber}`,
    `figure ${citationNumber}`,
    `Table ${citationNumber}`,
    `table ${citationNumber}`,
    
    // Equation patterns
    `Equation ${citationNumber}`,
    `equation ${citationNumber}`,
    `(${citationNumber})`,
  ];

  searchPatterns.forEach(pattern => {
    // Find elements containing the pattern
    const elements = doc.querySelectorAll('*');
    elements.forEach(element => {
      if (element.textContent?.includes(pattern)) {
        // Generate unique identifier for this element
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent?.substring(0, 50).trim();
        const elementId = `${tagName}-${textContent?.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
        
        if (!targets.includes(elementId)) {
          targets.push(elementId);
        }
      }
    });
  });

  return targets;
}

/**
 * Scrolls to a specific section in the paper content
 * @param targetId The ID of the target element
 * @param paperContentRef Reference to the paper content container
 */
export function scrollToSection(targetId: string, paperContentRef: React.RefObject<HTMLDivElement>) {
  if (!paperContentRef.current) return;

  const container = paperContentRef.current;
  
  // Try to find element by exact ID first
  let targetElement = container.querySelector(`#${targetId}`);
  
  // If not found, try to find by data attribute
  if (!targetElement) {
    targetElement = container.querySelector(`[data-citation-target="${targetId}"]`);
  }
  
  // If still not found, try to find by text content
  if (!targetElement) {
    const allElements = container.querySelectorAll('*');
    for (const element of allElements) {
      if (element.textContent?.includes(targetId.replace(/-/g, ' '))) {
        targetElement = element;
        break;
      }
    }
  }

  if (targetElement) {
    // Smooth scroll to the element
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Add highlighting effect
    targetElement.classList.add('citation-highlight');
    
    // Remove highlight after animation
    setTimeout(() => {
      targetElement?.classList.remove('citation-highlight');
    }, 2000);
  }
}

/**
 * Fixes image URLs in arXiv HTML content by converting relative URLs to absolute ones
 * @param htmlContent Original HTML content
 * @param paperId The arXiv paper ID
 * @returns HTML with fixed image URLs
 */
export function fixArxivImageUrls(htmlContent: string, paperId: string): string {
  if (!htmlContent || !paperId) return htmlContent;

  console.log(`🖼️ Processing images for paper ${paperId}`);
  
  // Convert relative image URLs to absolute arXiv URLs
  let fixedHtml = htmlContent;
  let imageCount = 0;

  // Fix relative image paths like src="/images/figure1.png" or src="images/figure1.png"
  fixedHtml = fixedHtml.replace(
    /src\s*=\s*["'](?!https?:\/\/)([^"']*\.(?:png|jpg|jpeg|gif|svg|webp))["']/gi,
    (match, imagePath) => {
      imageCount++;
      // Remove leading slash if present
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      // Construct absolute arXiv image URL
      const absoluteUrl = `https://arxiv.org/html/${paperId}/${cleanPath}`;
      console.log(`📷 Fixed image ${imageCount}: ${imagePath} → ${absoluteUrl}`);
      return `src="${absoluteUrl}" onerror="this.style.display='none'; this.nextElementSibling && this.nextElementSibling.style.display='block';" loading="lazy"`;
    }
  );

  // Add fallback text for broken images
  fixedHtml = fixedHtml.replace(
    /<img([^>]*src\s*=\s*["'][^"']*["'][^>]*)>/gi,
    (match, attributes) => {
      return `${match}<div style="display:none; text-align:center; padding:2em; color:var(--muted-foreground); background:var(--muted); border:1px dashed var(--border); border-radius:0.375rem; margin:1em 0;">📷 Image not available</div>`;
    }
  );

  // Fix background-image URLs in style attributes
  fixedHtml = fixedHtml.replace(
    /background-image\s*:\s*url\s*\(\s*["']?(?!https?:\/\/)([^"')]*\.(?:png|jpg|jpeg|gif|svg|webp))["']?\s*\)/gi,
    (match, imagePath) => {
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const absoluteUrl = `https://arxiv.org/html/${paperId}/${cleanPath}`;
      return `background-image: url("${absoluteUrl}")`;
    }
  );

  console.log(`✅ Image processing complete: ${imageCount} images found and fixed for paper ${paperId}`);
  return fixedHtml;
}

/**
 * Enhances HTML content by adding citation anchor points and fixing image URLs
 * @param htmlContent Original HTML content
 * @param paperId The arXiv paper ID for fixing image URLs
 * @returns Enhanced HTML with citation anchors and fixed images
 */
export function enhanceHtmlWithCitationAnchors(htmlContent: string, paperId?: string): string {
  if (!htmlContent) return htmlContent;

  // First fix image URLs if paperId is provided
  let enhancedHtml = paperId ? fixArxivImageUrls(htmlContent, paperId) : htmlContent;

  // Pattern for references like [1], [2], etc.
  enhancedHtml = enhancedHtml.replace(
    /\[(\d+)\]/g,
    '<span id="ref-$1" data-citation-target="ref-$1" class="citation-anchor">[$1]</span>'
  );

  // Pattern for parenthetical references like (1), (2), etc.
  enhancedHtml = enhancedHtml.replace(
    /\((\d+)\)/g,
    '<span id="paren-ref-$1" data-citation-target="paren-ref-$1" class="citation-anchor">($1)</span>'
  );

  // Pattern for section numbers
  enhancedHtml = enhancedHtml.replace(
    /(Section|section)\s+(\d+)/g,
    '<span id="section-$2" data-citation-target="section-$2" class="citation-anchor">$1 $2</span>'
  );

  // Pattern for figure references
  enhancedHtml = enhancedHtml.replace(
    /(Figure|figure)\s+(\d+)/g,
    '<span id="figure-$2" data-citation-target="figure-$2" class="citation-anchor">$1 $2</span>'
  );

  // Pattern for table references
  enhancedHtml = enhancedHtml.replace(
    /(Table|table)\s+(\d+)/g,
    '<span id="table-$2" data-citation-target="table-$2" class="citation-anchor">$1 $2</span>'
  );

  // Pattern for equation references
  enhancedHtml = enhancedHtml.replace(
    /(Equation|equation)\s+(\d+)/g,
    '<span id="equation-$2" data-citation-target="equation-$2" class="citation-anchor">$1 $2</span>'
  );

  return enhancedHtml;
}

/**
 * Creates a citation click handler
 * @param citationNumber The citation number that was clicked
 * @param paperContentRef Reference to the paper content container
 * @param sources Array of source information from Supermemory
 */
export function createCitationClickHandler(
  citationNumber: number, 
  paperContentRef: React.RefObject<HTMLDivElement>,
  sources?: any[]
) {
  return (event: React.MouseEvent) => {
    event.preventDefault();
    
    // Try different target patterns in order of preference
    const targetPatterns = [
      `ref-${citationNumber}`,
      `paren-ref-${citationNumber}`,
      `section-${citationNumber}`,
      `figure-${citationNumber}`,
      `table-${citationNumber}`,
      `equation-${citationNumber}`
    ];

    let targetFound = false;

    for (const pattern of targetPatterns) {
      const targetElement = paperContentRef.current?.querySelector(`[data-citation-target="${pattern}"]`);
      if (targetElement) {
        scrollToSection(pattern, paperContentRef);
        targetFound = true;
        break;
      }
    }

    // If no specific target found, try to scroll to the corresponding source section
    if (!targetFound && sources && sources[citationNumber - 1]) {
      const source = sources[citationNumber - 1];
      console.log(`📍 Citation ${citationNumber} clicked, attempting to find source:`, source);
      
      // Try to find the source by title or content
      if (source.title) {
        const titleElements = paperContentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const element of titleElements || []) {
          if (element.textContent?.toLowerCase().includes(source.title.toLowerCase().substring(0, 20))) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            element.classList.add('citation-highlight');
            setTimeout(() => element.classList.remove('citation-highlight'), 2000);
            targetFound = true;
            break;
          }
        }
      }
    }

    if (!targetFound) {
      console.log(`ℹ️ No specific target found for citation ${citationNumber}, scrolling to top`);
      paperContentRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
}
