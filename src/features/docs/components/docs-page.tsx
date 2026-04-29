'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { LexicalDocEditor } from '@/features/projects/components/lexical-doc-editor';

type DocType = 'masterplan' | 'agent' | 'readme' | 'reference' | 'note';

interface ProjectDoc {
  id: number;
  projectId: number | null;
  type: string;
  title: string;
  content: string;
  contentJson: unknown;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListItem {
  id: number;
  name: string;
}

const docTypeOptions: Array<{ value: DocType; label: string }> = [
  { value: 'masterplan', label: 'Masterplan' },
  { value: 'agent', label: 'agent.md' },
  { value: 'readme', label: 'README' },
  { value: 'reference', label: 'Reference' },
  { value: 'note', label: 'Note' }
];

export default function DocsPage() {
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [projectIdInput, setProjectIdInput] = useState<string>('none');
  const [type, setType] = useState<DocType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentJson, setContentJson] = useState<unknown>(null);
  const [readOnly, setReadOnly] = useState(false);

  const docsQueryKey = ['docs', 'global', selectedProjectFilter] as const;
  const { data: docsData } = useQuery({
    queryKey: docsQueryKey,
    queryFn: () =>
      apiClient<{ items: ProjectDoc[] }>(
        selectedProjectFilter === 'all'
          ? '/docs'
          : `/docs?projectId=${Number(selectedProjectFilter)}`
      ),
    retry: false
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'docs-selector'],
    queryFn: async () => {
      try {
        return await apiClient<{ items: ProjectListItem[] }>(
          '/projects?page=1&limit=200&sort=%5B%7B%22id%22%3A%22name%22%2C%22desc%22%3Afalse%7D%5D'
        );
      } catch {
        return { items: [] };
      }
    },
    retry: false
  });

  const docs = docsData?.items ?? [];
  const projects = projectsData?.items ?? [];
  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );
  const selectedDoc = docs.find((item) => item.id === selectedDocId) ?? null;

  const refreshDocs = async () => {
    await queryClient.invalidateQueries({ queryKey: ['docs'] });
    await queryClient.invalidateQueries({ queryKey: docsQueryKey });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiClient<ProjectDoc>('/docs', {
        method: 'POST',
        body: JSON.stringify({
          projectId: projectIdInput === 'none' ? null : Number(projectIdInput),
          type,
          title: title.trim() || 'Untitled',
          content,
          contentJson
        })
      });
    },
    onSuccess: async (created) => {
      toast.success('Doc created');
      setSelectedDocId(created.id);
      await refreshDocs();
    },
    onError: () => toast.error('Failed to create doc')
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocId) return null;
      return apiClient<ProjectDoc>(`/docs/${selectedDocId}`, {
        method: 'PUT',
        body: JSON.stringify({
          projectId: projectIdInput === 'none' ? null : Number(projectIdInput),
          type,
          title: title.trim() || 'Untitled',
          content,
          contentJson
        })
      });
    },
    onSuccess: async () => {
      toast.success('Doc updated');
      await refreshDocs();
    },
    onError: () => toast.error('Failed to update doc')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocId) return null;
      return apiClient(`/docs/${selectedDocId}`, { method: 'DELETE' });
    },
    onSuccess: async () => {
      toast.success('Doc deleted');
      resetForm();
      await refreshDocs();
    },
    onError: () => toast.error('Failed to delete doc')
  });

  const loadDoc = (doc: ProjectDoc) => {
    setSelectedDocId(doc.id);
    setType((doc.type as DocType) || 'note');
    setTitle(doc.title);
    setContent(doc.content);
    setContentJson(doc.contentJson ?? null);
    setProjectIdInput(doc.projectId == null ? 'none' : String(doc.projectId));
    setReadOnly(true);
  };

  const resetForm = () => {
    setSelectedDocId(null);
    setType('note');
    setTitle('');
    setContent('');
    setContentJson(null);
    setProjectIdInput('none');
    setReadOnly(false);
  };

  return (
    <div className='grid gap-4 lg:grid-cols-[340px_1fr]'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Doc Listing</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-2'>
            <Label>Filter Project</Label>
            <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type='button' variant='outline' className='w-full' onClick={resetForm}>
            + New Doc
          </Button>
          <div className='space-y-2'>
            {docs.length === 0 ? (
              <div className='text-muted-foreground rounded-md border border-dashed p-3 text-sm'>
                No docs found.
              </div>
            ) : (
              docs.map((doc) => (
                <button
                  key={doc.id}
                  type='button'
                  onClick={() => loadDoc(doc)}
                  className={`w-full rounded-md border p-3 text-left text-sm ${
                    selectedDocId === doc.id ? 'bg-muted border-primary' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className='font-medium'>{doc.title}</div>
                  <div className='text-muted-foreground mt-1 text-xs'>
                    {doc.type} ·{' '}
                    {doc.projectId
                      ? (projectMap.get(doc.projectId) ?? `Project #${doc.projectId}`)
                      : 'Global'}{' '}
                    · {new Date(doc.updatedAt).toLocaleString('id-ID')}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>
            {selectedDoc ? `Edit Doc #${selectedDoc.id}` : 'Create Doc'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Project</Label>
              <Select value={projectIdInput} onValueChange={setProjectIdInput}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Global / No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as DocType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {docTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label>Content</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setReadOnly((value) => !value)}
              >
                {readOnly ? 'Switch to Edit' : 'Switch to Read'}
              </Button>
            </div>
            <LexicalDocEditor
              key={`${selectedDocId ?? 'new'}-${readOnly ? 'read' : 'edit'}`}
              initialJson={contentJson}
              readOnly={readOnly}
              onChangeJson={(value) => setContentJson(value)}
              onChangePlainText={(value) => setContent(value)}
            />
          </div>

          <div className='flex flex-wrap justify-end gap-2'>
            {selectedDoc ? (
              <Button
                type='button'
                variant='destructive'
                onClick={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            ) : null}
            {selectedDoc ? (
              <Button
                type='button'
                onClick={() => saveMutation.mutate()}
                isLoading={saveMutation.isPending}
              >
                Save Changes
              </Button>
            ) : (
              <Button
                type='button'
                onClick={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
              >
                Create Doc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
