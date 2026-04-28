'use client';

import { useEffect } from 'react';
import { $generateNodesFromDOM } from '@lexical/html';
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $getRoot, $insertNodes, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND } from 'lexical';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { Button } from '@/components/ui/button';

interface LexicalDocEditorProps {
  initialJson: unknown;
  onChangeJson: (value: unknown) => void;
  onChangePlainText: (value: string) => void;
  readOnly?: boolean;
}

function Toolbar({ readOnly }: { readOnly?: boolean }) {
  const [editor] = useLexicalComposerContext();

  if (readOnly) return null;

  return (
    <div className='flex flex-wrap gap-2 border-b p-2'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        Bold
      </Button>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        Italic
      </Button>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
      >
        Left
      </Button>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        Bullet
      </Button>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        Numbered
      </Button>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => {
          const url = window.prompt('Link URL');
          if (!url) return;
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }}
      >
        Link
      </Button>
    </div>
  );
}

function InitializeContentPlugin({ initialJson }: { initialJson: unknown }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      if (initialJson && typeof initialJson === 'object') {
        const parsedState = editor.parseEditorState(JSON.stringify(initialJson));
        editor.setEditorState(parsedState);
        return;
      }

      if (typeof initialJson === 'string' && initialJson.trim()) {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialJson, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        $insertNodes(nodes);
      }
    });
  }, [editor, initialJson]);

  return null;
}

export function LexicalDocEditor({
  initialJson,
  onChangeJson,
  onChangePlainText,
  readOnly = false
}: LexicalDocEditorProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'project-doc-editor',
        editable: !readOnly,
        onError: (error) => {
          throw error;
        },
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode]
      }}
    >
      <div className='overflow-hidden rounded-md border'>
        <Toolbar readOnly={readOnly} />
        <div className='bg-background min-h-[360px] p-4'>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className='min-h-[320px] whitespace-pre-wrap outline-none'
                aria-placeholder='Write documentation...'
                placeholder={<div className='text-muted-foreground'>Write documentation...</div>}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <InitializeContentPlugin initialJson={initialJson} />
          <OnChangePlugin
            onChange={(editorState) => {
              if (readOnly) return;
              const json = editorState.toJSON();
              onChangeJson(json);
              editorState.read(() => {
                const text = $getRoot().getTextContent();
                onChangePlainText(text);
              });
            }}
            ignoreSelectionChange
          />
        </div>
      </div>
    </LexicalComposer>
  );
}
