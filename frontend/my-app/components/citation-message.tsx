"use client";

import React from 'react';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';
import { parseCitations, createCitationClickHandler, MessagePart } from '@/lib/citation-handler';

interface CitationMessageProps {
  content: string;
  sources?: any[];
  paperContentRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function CitationMessage({ 
  content, 
  sources = [], 
  paperContentRef, 
  className = "" 
}: CitationMessageProps) {
  const { parts, citations } = parseCitations(content);

  const renderPart = (part: MessagePart, index: number) => {
    if (part.type === 'citation' && part.citationNumber) {
      const citationNumber = part.citationNumber;
      const source = sources[citationNumber - 1];
      
      return (
        <Button
          key={`citation-${index}`}
          variant="link"
          size="sm"
          className="p-0 h-auto font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1 mx-1"
          onClick={createCitationClickHandler(citationNumber, paperContentRef, sources)}
          title={source ? `Jump to: ${source.title || 'Source material'}` : `Jump to source ${citationNumber}`}
        >
          <ExternalLink className="h-3 w-3" />
          [Source {citationNumber}]
        </Button>
      );
    }

    return (
      <span key={`text-${index}`} className="whitespace-pre-wrap">
        {part.content}
      </span>
    );
  };

  if (citations.length === 0) {
    // No citations found, render as normal text
    return (
      <div className={`leading-relaxed ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`leading-relaxed ${className}`}>
      {parts.map((part, index) => renderPart(part, index))}
      
      {/* Show citation summary if sources are available */}
      {citations.length > 0 && sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            {Array.from(new Set(citations.map(c => c.citationNumber))).length === 1 
              ? 'Referenced Source:' 
              : `Referenced Sources (${Array.from(new Set(citations.map(c => c.citationNumber))).length}):`
            }
          </div>
          <div className="space-y-1">
            {/* Only show unique sources, not repeated ones */}
            {Array.from(new Set(citations.map(c => c.citationNumber))).map((citationNumber) => {
              const source = sources[citationNumber - 1];
              if (!source) return null;
              
              return (
                <div
                  key={citationNumber}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    onClick={createCitationClickHandler(citationNumber, paperContentRef, sources)}
                  >
                    [Source {citationNumber}]
                  </Button>
                  <span className="flex-1">
                    {source.title || 'Untitled Document'}
                    {source.relevantChunks > 0 && (
                      <span className="ml-2 text-xs opacity-70">
                        ({source.relevantChunks} relevant sections)
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CitationMessage;
