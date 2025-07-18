// app/page.tsx (Next.js App Router 기준)

'use client';

import { useState, useRef, useEffect } from "react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { error } from "console";

export default function DashboardPage() {
  const [device, setDevice] = useState<'pc' | 'mobile' | 'rw'>('pc');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [jsonPath, setJsonPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlUrl, setHtmlUrl] = useState('');
  const [preview, setPreview] = useState<{ visible: boolean; src: string; isError: boolean, msg: string }>({
        visible: false,
        src: '',
        isError: false,
        msg: '',
    });

  const handleGenerate = async () => {

    if (!figmaUrl.trim()) {
      toast.warning('❗ Figma URL을 입력해주세요.');
      return;
    }
    // if (!minWidth.trim() || isNaN(Number(minWidth)) || Number(minWidth) <= 0) {
    //   toast.warning('❗ 최소 해상도를 올바르게 입력해주세요.');
    //   return;
    // }
    setLoading(true);
    const baseUrl = "http://34.173.50.243"
    // const baseUrl = "http://127.0.0.1:3000"
    try {
      const figmaApiRes = await fetch(`${baseUrl}/api/figma/exportJson?url=${figmaUrl}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      console.log(figmaApiRes)
      if (!figmaApiRes.ok) {
        throw new Error(`❌ 서버 응답 오류: ${figmaApiRes.status}`);
      }

      const figmaData = await figmaApiRes.json();
      const filename = figmaData?.jsonPath;

      if (!filename) {
        toast.error('❌ figma.json 파일 생성 실패');
        return;
      }
       setJsonPath(`filename`);
      console.log(device, filename);
      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: filename, device: device }),
      }).catch(err => {
        console.log(err)
        throw new Error(`❌ 서버 응답 오류: ${err}`);
      })
      // 
      if (!res.status) {
        throw new Error(`❌ 서버 응답 오류: ${res.statusText}`);
      }
      const data = await res.json();
      // setHtmlUrl(`${baseUrl}/web/${data.path}`);
      if(data.path === undefined){
        throw new Error(`❌ 서버 응답 오류`);
      }
      setPreview({
            visible: true,
            isError: false,
            src: `${baseUrl}/web/${data.path}`,
            msg: '',
        });
      toast.success('✅ HTML/CSS 생성 완료');
    } catch (error: unknown) {
      const err = error as Error;
      setPreview({
        ...preview,
          isError: true,
          msg: err.message || '알 수 없는 오류',
          visible: false
      });
      toast.error('에러 발생: ' + (err.message || '알 수 없는 오류'));
    }
    setLoading(false);

  };

    // const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    //     const fullUrl = `${url}`;
    //     setPreview({
    //         visible: true,
    //         src: fullUrl,
    //         x: e.pageX + 20,
    //         y: e.pageY - 50,
    //     });
    // };

    // const handleMouseLeave = () => {
    //     setPreview({ ...preview, visible: false });
    // };

  return (
    <div className="min-h-screen px-6 py-10 relative">
      <h1 className="text-xl font-bold mb-6">T UI</h1>

      <div className="flex items-center gap-4 mb-4">
        <RadioGroup defaultValue="pc" onValueChange={(v) => setDevice(v as any)} className="flex gap-4">
          <RadioGroupItem value="pc" id="pc" /> <label htmlFor="pc">PC</label>
          <RadioGroupItem value="mobile" id="mobile" /> <label htmlFor="mobile">Mobile</label>
          <RadioGroupItem value="rw" id="rw" /> <label htmlFor="rw">RW</label>
        </RadioGroup>
        {/* <div className="flex items-center gap-2">
          <label className="text-sm">최소 해상도</label>
          <Input type="number" value={minWidth} onChange={(e) => setMinWidth(e.target.value)} className="w-32" />
          <span>px</span>
        </div> */}
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="https://figma.com/your-design-url"
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
        />
        <Button onClick={handleGenerate}>생성</Button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
      { preview.visible && (
      <>
      {/* <a
          href={`${preview.src}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 visited:text-purple-700 hover:underline break-all"
          onMouseEnter={(e) => handleMouseEnter(e, preview.src)}
          onMouseLeave={handleMouseLeave}
        >{preview.src} </a> */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

            <div className="flex flex-col gap-3">
              {preview.src && <a href={preview.src} target="_blank" rel="noopener" className="border px-4 py-2 rounded text-blue-600">HTML Link</a>}
             
            </div>
            <div className="border w-full aspect-[4/3] rounded overflow-hidden">
              {preview.src ? (
                <iframe src={preview.src} className="w-full h-full" title="preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">미리보기 없음</div>
              )}
            </div>
          </div></>
      )}
      {/* <div className="grid grid-cols-1 gap-6 mt-8">
        {jobs.map((job) => (
          <div key={job.jobId} className="border rounded p-4">
            <div className="mb-2 text-sm font-medium">Job ID: {job.jobId}</div>
            {job.status === 'processing' ? (
              <div className="text-yellow-600">⏳ 생성 중...</div>
            ) : (
              <div className="flex flex-col gap-2">
                {job.htmlUrl && (
                  <a href={job.htmlUrl} target="_blank" className="text-blue-600 underline link_preview">HTML Link</a>
                )}
                {job.cssUrl && <a href={job.cssUrl} target="_blank" className="text-blue-600 underline">CSS Link</a>}
                {job.zipUrl && <a href={job.zipUrl} download className="text-blue-600 underline">ZIP Download</a>}
              </div>
            )}
          </div>
        ))}
      </div> */}
      {/* {preview.visible && (
        <iframe
            src={preview.src}
            style={{
                position: 'absolute',
                top: `${preview.y}px`,
                left: `${preview.x}px`,
                width: '504px', // 1440 * 0.35
                height: '525px', // 1500 * 0.35
                border: '1px solid #ccc',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                backgroundColor: '#fff',
                zIndex: 50,
                transformOrigin: 'top left',
            }}
        />
      )} */}
      { preview.isError && (<div className="flex flex-col gap-3">
              <p className="border px-4 py-2 rounded text-red-600">AI 생성에 실패했습니다. (네트워크 또는 입출력 토큰을 확인)</p>
            </div>)}
    </div>
  );
}