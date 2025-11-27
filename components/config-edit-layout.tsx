'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UseFormReturn } from 'react-hook-form';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import type { ZodSchema } from 'zod';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface ConfigEditLayoutProps<TFormData extends Record<string, any>> {
  title: string;
  subtitle: string;
  resourceType: string;
  listPath: string;
  isLoading: boolean;
  data: TFormData | null | undefined;
  form: UseFormReturn<TFormData>;
  schema: ZodSchema<TFormData>;
  isPending: boolean;
  onSubmit: (data: TFormData) => void;
  children: ReactNode;
  defaultConfig?: Partial<TFormData>;
  createMode?: boolean; // force create mode even if data is null
}

export function ConfigEditLayout<TFormData extends Record<string, any>>({
  title,
  subtitle,
  resourceType,
  listPath,
  isLoading,
  data,
  form,
  schema,
  isPending,
  onSubmit,
  children,
  defaultConfig,
  createMode = false,
}: ConfigEditLayoutProps<TFormData>) {
  const router = useRouter();
  const { theme } = useTheme();
  const [codeContent, setCodeContent] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const { handleSubmit, reset, getValues, watch, formState } = form;
  // Persist code editor mount to avoid Monaco background cancellation spam when switching tabs
  const [editorMounted, setEditorMounted] = useState(false);
  const formValues = watch();

  const isCreate = createMode || (!data && !!defaultConfig);

  const handleFillDefaults = () => {
    if (!defaultConfig) return;
    const currentValues = getValues();
    const deepMerge = (target: any, source: any): any => {
      const output = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = deepMerge(target[key] || {}, source[key]);
        } else if (target[key] === undefined || target[key] === null || target[key] === '') {
          output[key] = source[key];
        }
      }
      return output;
    };
    const filledData = deepMerge(currentValues, defaultConfig);
    reset(filledData, { keepDefaultValues: false });
    if (activeTab === 'code') setCodeContent(JSON.stringify(filledData, null, 2));
    toast.success('Default values filled');
  };

  const isEmpty = (val: any): boolean => {
    if (val === undefined || val === null || val === '') return true;
    if (typeof val === 'object') {
      if (Array.isArray(val)) return val.length === 0;
      return Object.keys(val).length === 0;
    }
    return false;
  };
  const normalizeValue = (val: any): any => {
    if (isEmpty(val)) return undefined;
    if (typeof val === 'object' && !Array.isArray(val)) {
      const normalized: any = {};
      for (const key in val) {
        const n = normalizeValue(val[key]);
        if (n !== undefined) normalized[key] = n;
      }
      return Object.keys(normalized).length === 0 ? undefined : normalized;
    }
    return val;
  };

  const codeHasChanges = data && codeContent !== JSON.stringify(data, null, 2);
  const formHasChanges = useMemo(() => {
    if (!data || isCreate) return false;
    const currentNormalized = normalizeValue(formValues);
    const originalNormalized = normalizeValue(data);
    return JSON.stringify(currentNormalized) !== JSON.stringify(originalNormalized);
  }, [formValues, data, isCreate]);

  const hasChanges = isCreate
    ? (activeTab === 'form' ? formState.isDirty : true)
    : (activeTab === 'form' ? formHasChanges : codeHasChanges);

  const getChangedFields = () => {
    if (!data || !formHasChanges) return [];
    const currentValues = getValues();
    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(currentValues), ...Object.keys(data)]);
    for (const key of allKeys) {
      const currentVal = normalizeValue((currentValues as any)[key]);
      const originalVal = normalizeValue((data as any)[key]);
      if (JSON.stringify(currentVal) !== JSON.stringify(originalVal)) changed.push(key);
    }
    return changed;
  };
  const changedFields = isCreate ? [] : (formHasChanges ? getChangedFields() : []);

  useEffect(() => {
    if (data && !isCreate) {
      reset(data, { keepDefaultValues: false });
      setCodeContent(JSON.stringify(data, null, 2));
      return;
    }
    if (isCreate && defaultConfig) {
      const initialValues = getValues();
      const merged = { ...defaultConfig, ...initialValues } as TFormData;
      setCodeContent(JSON.stringify(merged, null, 2));
    }
    // Intentionally exclude getValues/reset to avoid effect thrash and update loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isCreate, defaultConfig]);

  useEffect(() => {
    if (activeTab === 'code') {
      if (!editorMounted) setEditorMounted(true);
      const currentValues = getValues();
      setCodeContent(JSON.stringify(currentValues, null, 2));
    }
  }, [activeTab, getValues, editorMounted]);

  const handleTabChange = (newTab: string) => {
    if (newTab === 'form' && activeTab === 'code') {
      try {
        const parsedData = JSON.parse(codeContent);
        reset(parsedData, { keepDefaultValues: false });
      } catch (err) {
        toast.error('Invalid JSON syntax - cannot switch to form view');
        return;
      }
    }
    setActiveTab(newTab);
  };

  const handleCodeSave = () => {
    try {
      const parsedData = JSON.parse(codeContent);
      const validated = schema.parse(parsedData);
      onSubmit(validated);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        toast.error('Invalid JSON syntax');
      } else if (err?.message) {
        toast.error(`Validation error: ${err.message}`);
      } else {
        toast.error('Failed to save configuration');
      }
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading {resourceType}...</p>
        </div>
      </AppLayout>
    );
  }

  if (!data && !isCreate) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{resourceType} not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-4">
          <Link href={listPath}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <TabsList className="grid w-full sm:max-w-md grid-cols-2">
              <TabsTrigger value="form">Visual Editor</TabsTrigger>
              <TabsTrigger value="code">Code Editor</TabsTrigger>
            </TabsList>
            {defaultConfig && (
              <Button variant="outline" size="sm" onClick={handleFillDefaults} className="w-full sm:w-auto">
                Fill Defaults
              </Button>
            )}
          </div>

          <TabsContent value="form" className="space-y-6">
            <form
              onSubmit={handleSubmit(onSubmit, (errors) => {
                console.error('[Form Validation] Errors:', errors);
                toast.error('Form has validation errors. Check console for details.');
              })}
              className="space-y-6"
            >
              {children}
            </form>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JSON Configuration</CardTitle>
                <CardDescription>Edit the raw JSON configuration file</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px] sm:h-[600px] border-t">
                  {editorMounted && (
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={codeContent}
                      onChange={(value) => setCodeContent(value || '')}
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                      }}
                    />
                  )}
                  {!editorMounted && (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Loading editor...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-10">
          <div className="mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                {hasChanges ? (
                  <div className="text-sm">
                    <span className="font-medium text-orange-600 dark:text-orange-400">Unsaved changes</span>
                    {changedFields.length > 0 && (
                      <span className="text-muted-foreground ml-2 hidden sm:inline">Modified: {changedFields.join(', ')}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No changes</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(listPath)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={activeTab === 'form'
                    ? handleSubmit(onSubmit, (errors) => {
                        console.error('[Form Validation] Errors:', errors);
                        toast.error('Form has validation errors. Check console for details.');
                      })
                    : handleCodeSave}
                  disabled={isPending || (!hasChanges && !isCreate)}
                  className="flex-1 sm:flex-none"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? (isCreate ? 'Creating...' : 'Saving...') : (isCreate ? 'Create' : 'Save Changes')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
