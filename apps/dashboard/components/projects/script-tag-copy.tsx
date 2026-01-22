'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils';

interface ScriptTagCopyProps {
  projectId: string;
}

const WIDGET_BASE_URL = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://cdn.zapbolt.io';

export function ScriptTagCopy({ projectId }: ScriptTagCopyProps) {
  const [copied, setCopied] = useState(false);

  const scriptTag = `<script src="${WIDGET_BASE_URL}/widget.js?projectId=${projectId}"></script>`;

  const handleCopy = async () => {
    await copyToClipboard(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3" data-tour="install-widget">
      <p className="text-sm text-muted-foreground">
        Add this script tag to your website, just before the closing{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag:
      </p>
      <div className="relative">
        <pre className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap break-all">
          <code>{scriptTag}</code>
        </pre>
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
