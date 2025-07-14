// app/page.tsx (Next.js App Router 기준)

'use client';

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, CloudDownload, Download } from "lucide-react";

export default function DashboardPage() {
  const [step, setStep] = useState(2);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [jsonUrl, setJsonUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileInputMode, setFileInputMode] = useState<'upload' | 'path'>('upload');
  const [jsonPath, setJsonPath] = useState("");
  const [jsonPathInput, setJsonPathInput] = useState("");
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [liveTime, setLiveTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // const baseUrl = "https://t-ui-api.dev.onkakao.net"
  const baseUrl = "http://34.173.50.243"
   useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setLiveTime((t) => t + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLiveTime(0);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading]);

  const handleExtractJson = async () => {
    setLoading(true);
    setStatus("Figma JSON 추출 중...");
    try {
      const res = await fetch(`${baseUrl}/api/figma/exportJson?url=${figmaUrl}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      console.log(res)
      if (!res.ok) {
        throw new Error(`❌ 서버 응답 오류: ${res.status}`);
      }
      const data = await res.json();
      // const blob = await res.blob();
      setStatus("✔️ JSON 추출 완료");
      setStep(2);

      // 👇 JSON 파일을 로컬에 다운로드 경로 추가
    
      setJsonPath(`${data.jsonPath}`);
    } catch (err) {
      setStatus("❌ 실패: " + err);
    }
    setLoading(false);
  };

  const handleGenerateHtmlCss = async () => {
    setElapsedTime(null);
    setLoading(true);
    const start = performance.now();
    setStatus("Gemini 호출 중...");
    try {

      const res = await fetch(`${baseUrl}/api/gemini/generate`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: jsonPath }),
      })
      // 
      if (!res.status) {
        
        throw new Error(`❌ 서버 응답 오류: ${res.statusText}`);
      }
      const end = performance.now();
      const seconds = ((end - start) / 1000).toFixed(2);
      setElapsedTime(Number(seconds));
      const blob = await res.blob(); // ZIP 파일 받아오기
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `html-${Date.now()}.zip`; // 다운로드될 파일명
      a.click();

      window.URL.revokeObjectURL(downloadUrl); // 메모리 해제
      const file = new File([blob], `html-${Date.now()}.zip`, { type: "application/zip" });
      setZipFile(file);
      setStatus("✔️ HTML/CSS 생성 완료");
      setStep(3);
    } catch (err) {
      setStatus("❌ 실패: " + err);
    }
    setLoading(false);
  };

  const handleZipDownload = () => {
    if (!zipFile) {
      alert("파일을 찾을 수 없습니다.");
      return;
    }

    const url = URL.createObjectURL(zipFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFile.name || "result.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">📦 t-ui</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1. Figma 링크로 JSON 추출</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Figma 링크</Label>
          <Input value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} placeholder="https://www.figma.com/..." />
          <div className="flex gap-3 items-center mt-4">
            {!jsonPath ? <Button onClick={handleExtractJson} disabled={loading || !figmaUrl}>
              {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : "🔍 추출 시작"}
            </Button>: ''}
          </div>
        </CardContent>
      </Card>

      {step >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 2. Gemini로 HTML/CSS 생성</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="block mb-1">1분이상 소요되며, 완료 시 자동 다운로드 됩니다.</Label>
            {/* <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="예: 시멘틱 태그, Tailwind 반응형 구조" className="mb-4" /> */}
            <Button className="mt-4" onClick={handleGenerateHtmlCss} disabled={loading || !jsonPath}>
              {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : "⚙️ 생성 시작"}
            </Button>
            <div className="text-sm text-gray-500 mt-2">
              {loading && <span>⏱ 진행 중: {liveTime}초</span>}
              {elapsedTime && !loading && <span>✅ 완료: {elapsedTime}초</span>}
            </div>
          
          </CardContent>
        </Card>
      )}

      {status && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="text-green-500 w-5 h-5" />}
          <span>{status}</span>
        </div>
      )}

      {step === 3 && zipFile && (
        <div className="mt-6 flex items-center gap-3">
          <CloudDownload className="w-6 h-6" />
          <a onClick={handleZipDownload} className="text-blue-600 underline" download>
            ZIP 다운로드
          </a>
        </div>
      )}
    </main>
  );
}
