$ErrorActionPreference = "Stop"
$root=Get-Location
$app=Join-Path $root "src\App.tsx"
if(!(Test-Path $app)){throw "JainVaani project folder mein run karo (jahan package.json hai)."}
$s=Get-Content $app -Raw -Encoding UTF8
if($s.Contains("ContentFeatures")){throw "Patch pehle se apply hai. Dobara mat chalao."}
$s=$s.Replace('import { SwadhyayManager, SwadhyaySessions } from "./SwadhyayFeatures";','import { SwadhyayManager, SwadhyaySessions } from "./SwadhyayFeatures";'+"`r`n"+'import { AdminContent, MemberNotices, MemberPravachan, MemberQuizzes } from "./ContentFeatures";')
$replacements=@(
@('{tab === "pravachan" && <SectionPage eyebrow="YOUTUBE COLLECTION" title={t.pravachan} desc={t.pravachanDesc}><EmptyCard message={t.coming} /></SectionPage>}','{tab === "pravachan" && <SectionPage eyebrow="YOUTUBE COLLECTION" title={t.pravachan} desc={t.pravachanDesc}><MemberPravachan /></SectionPage>}'),
@('{tab === "quiz" && <SectionPage eyebrow="LEARN & ASSESS" title={t.quiz} desc={t.quizDesc}><EmptyCard message={t.coming} /></SectionPage>}','{tab === "quiz" && <SectionPage eyebrow="LEARN & ASSESS" title={t.quiz} desc={t.quizDesc}><MemberQuizzes /></SectionPage>}'),
@('{tab === "notices" && <SectionPage eyebrow="ANNOUNCEMENTS" title={t.notices} desc={t.noticesDesc}><EmptyCard message={t.coming} /></SectionPage>}','{tab === "notices" && <SectionPage eyebrow="ANNOUNCEMENTS" title={t.notices} desc={t.noticesDesc}><MemberNotices /></SectionPage>}')
)
foreach($pair in $replacements){if(!$s.Contains($pair[0])){throw "Member placeholder exact match nahi hua. Koi file change nahi ki."};$s=$s.Replace($pair[0],$pair[1])}
$old=@'
              <div className="admin-grid">
                {["Quiz & certificates", "Notices", "Members", "Previous Pravachan"].map((x, i) => (
                  <div className="admin-tile" key={x}><span>{["✎", "♧", "♙", "▶"][i]}</span><b>{x}</b><small>Next setup stage</small></div>
                ))}
              </div>
'@
if(!$s.Contains($old)){throw "Admin placeholder exact match nahi hua. Koi file change nahi ki."}
$s=$s.Replace($old,'              <AdminContent />')
Copy-Item $app "$app.backup_before_content_features" -Force
[System.IO.File]::WriteAllText($app,$s,(New-Object System.Text.UTF8Encoding($false)))
Copy-Item (Join-Path $PSScriptRoot "src\ContentFeatures.tsx") (Join-Path $root "src\ContentFeatures.tsx") -Force
Write-Host "JainVaani features installed. Backup created." -ForegroundColor Green
