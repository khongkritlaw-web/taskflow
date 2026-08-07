import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen,
  Folder,
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText,
  ChevronRight,
  Download,
  Search,
  ArrowLeft,
  ExternalLink,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Grid,
  List,
  RefreshCw,
  HelpCircle,
  FileCheck,
  FolderUp,
  Maximize2,
  Cloud,
  HardDrive
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { auth } from '../firebase';

// Define structures for our local system file explorer
interface FileItem {
  id: string;
  name: string;
  kind: 'file' | 'directory';
  path: string;
  file?: File; // Holds the real browser File object when fetched/loaded
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle; // File System Access API handles
  size?: number;
  type?: string;
  children?: FileItem[];
  webViewLink?: string; // Google Drive Web View Link
}

interface LocalFileExplorerProps {
  accentColor: string;
  darkMode: boolean;
}

export default function LocalFileExplorer({ accentColor, darkMode }: LocalFileExplorerProps) {
  // Main states
  const [rootDirectoryName, setRootDirectoryName] = useState<string>('');
  const [allFilesTree, setAllFilesTree] = useState<FileItem[]>([]);
  const [currentFolderPath, setCurrentFolderPath] = useState<string[]>([]); // Array of folder names from root
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Source selection: 'local' (เครื่องนี้) or 'drive' (Google Drive)
  const [activeSource, setActiveSource] = useState<'local' | 'drive'>('local');

  // Google Drive states
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveLoading, setDriveLoading] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string>('');
  const [driveFilesTree, setDriveFilesTree] = useState<FileItem[]>([]);
  const [driveFolderStack, setDriveFolderStack] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'กูเกิลไดรฟ์ของฉัน' }
  ]);
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('');
  
  // Selection and preview
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFileBlobUrl, setSelectedFileBlobUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [textLoading, setTextLoading] = useState(false);

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Video player states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Image viewer states
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [checkerboardBg, setCheckerboardBg] = useState(false);

  // Refs for audio, video and inputs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Format File Size
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return 'ไม่ทราบขนาด';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert FileSystemDirectoryHandle to our FileItem tree structure
  const buildTreeFromHandle = async (
    dirHandle: FileSystemDirectoryHandle,
    currentPath = ''
  ): Promise<FileItem[]> => {
    const items: FileItem[] = [];
    try {
      for await (const entry of (dirHandle as any).values()) {
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        const id = `handle_${Math.random().toString(36).substr(2, 9)}`;
        
        if (entry.kind === 'directory') {
          // Recursively read subdirectories
          const children = await buildTreeFromHandle(entry, entryPath);
          items.push({
            id,
            name: entry.name,
            kind: 'directory',
            path: entryPath,
            handle: entry,
            children
          });
        } else {
          // Fetch File metadata
          const file = await entry.getFile();
          items.push({
            id,
            name: entry.name,
            kind: 'file',
            path: entryPath,
            handle: entry,
            file,
            size: file.size,
            type: file.type
          });
        }
      }
    } catch (err) {
      console.error('Error building tree from directory handle:', err);
    }

    // Sort: directories first, then files alphabetically
    return items.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'th');
    });
  };

  // Build tree from standard webkitdirectory files list (Safari/Firefox/Mobile fallback)
  const buildTreeFromFiles = (files: FileList): FileItem[] => {
    const root: FileItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // File paths look like: "folderName/subfolder/file.jpg"
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
      
      let currentLevel = root;
      let accumulatedPath = '';
      
      for (let j = 0; j < pathParts.length; j++) {
        const part = pathParts[j];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        const isLast = j === pathParts.length - 1;
        
        let existing = currentLevel.find(item => item.name === part);
        if (!existing) {
          existing = {
            id: `file_${Math.random().toString(36).substr(2, 9)}_${i}`,
            name: part,
            kind: isLast ? 'file' : 'directory',
            path: accumulatedPath,
            file: isLast ? file : undefined,
            size: isLast ? file.size : undefined,
            type: isLast ? file.type : undefined,
            children: isLast ? undefined : []
          };
          currentLevel.push(existing);
        }
        
        if (!isLast && existing.children) {
          currentLevel = existing.children;
        }
      }
    }
    
    // Sort tree
    const sortTree = (items: FileItem[]): FileItem[] => {
      return items.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'th');
      }).map(item => {
        if (item.children) {
          item.children = sortTree(item.children);
        }
        return item;
      });
    };
    
    return sortTree(root);
  };

  // Handle Directory Selection via modern showDirectoryPicker API
  const handleSelectDirectoryAPI = async () => {
    try {
      // @ts-ignore
      if (typeof window.showDirectoryPicker === 'function') {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        setRootDirectoryName(dirHandle.name);
        setSelectedFile(null);
        setCurrentFolderPath([]);
        
        const tree = await buildTreeFromHandle(dirHandle);
        setAllFilesTree(tree);
      } else {
        // Fallback to standard input element trigger
        folderInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory Picker Error:', err);
        // Fallback
        folderInputRef.current?.click();
      }
    }
  };

  // Handle standard <input type="file" webkitdirectory> folder change
  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Extract root directory name from first file's relative path
      const firstPath = files[0].webkitRelativePath;
      const rootName = firstPath ? firstPath.split('/')[0] : 'Local Directory';
      
      setRootDirectoryName(rootName);
      setSelectedFile(null);
      setCurrentFolderPath([]);
      
      const tree = buildTreeFromFiles(files);
      // Since tree starts with the root folder name as a single node when built this way,
      // let's check if the top node is indeed the directory name
      if (tree.length === 1 && tree[0].kind === 'directory' && tree[0].name === rootName) {
        setAllFilesTree(tree[0].children || []);
      } else {
        setAllFilesTree(tree);
      }
    }
  };

  // Handle selecting individual files directly
  const handleSelectFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setRootDirectoryName('ไฟล์ที่เลือกไว้');
      setSelectedFile(null);
      setCurrentFolderPath([]);
      
      const fileList: FileItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileList.push({
          id: `file_direct_${Math.random().toString(36).substr(2, 9)}_${i}`,
          name: file.name,
          kind: 'file',
          path: file.name,
          file: file,
          size: file.size,
          type: file.type
        });
      }
      setAllFilesTree(fileList.sort((a, b) => a.name.localeCompare(b.name, 'th')));
    }
  };

  // Google Drive Handlers
  const handleGoogleLogin = async () => {
    try {
      setDriveLoading(true);
      setDriveError('');
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setDriveAccessToken(credential.accessToken);
        setDriveUser(result.user);
        // Reset stack to root
        const initialStack = [{ id: 'root', name: 'กูเกิลไดรฟ์ของฉัน' }];
        setDriveFolderStack(initialStack);
        await fetchDriveFiles(credential.accessToken, 'root');
      } else {
        setDriveError('ไม่สามารถรับ Access Token จากความน่าเชื่อถือของ Google ได้');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setDriveError(err.message || 'การเข้าสู่ระบบกูเกิลล้มเหลว');
    } finally {
      setDriveLoading(false);
    }
  };

  const fetchDriveFiles = async (token: string, folderId: string = 'root') => {
    try {
      setDriveLoading(true);
      setDriveError('');
      
      const queryStr = `'${folderId}' in parents and trashed = false`;
      const fields = 'files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryStr)}&fields=${encodeURIComponent(fields)}&pageSize=100`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      const driveItems: FileItem[] = (data.files || []).map((file: any) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        return {
          id: `drive_${file.id}`,
          name: file.name,
          kind: isFolder ? 'directory' : 'file',
          path: file.id, // Store file ID in the path field
          size: file.size ? parseInt(file.size) : undefined,
          type: file.mimeType,
          webViewLink: file.webViewLink
        };
      });
      
      // Sort: folders first, then alphabetical
      const sortedItems = driveItems.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'th');
      });
      
      setDriveFilesTree(sortedItems);
    } catch (err: any) {
      console.error('Error fetching Google Drive files:', err);
      setDriveError(err.message || 'ไม่สามารถดึงข้อมูลไฟล์จากกูเกิลไดรฟ์ได้');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveFolderClick = (folderId: string, folderName: string) => {
    const newStack = [...driveFolderStack, { id: folderId, name: folderName }];
    setDriveFolderStack(newStack);
    if (driveAccessToken) {
      fetchDriveFiles(driveAccessToken, folderId);
    }
  };

  const handleDriveGoUp = () => {
    if (driveFolderStack.length > 1) {
      const newStack = driveFolderStack.slice(0, -1);
      setDriveFolderStack(newStack);
      const parentFolder = newStack[newStack.length - 1];
      if (driveAccessToken) {
        fetchDriveFiles(driveAccessToken, parentFolder.id);
      }
    }
  };

  const handleDriveBreadcrumbClick = (index: number) => {
    const newStack = driveFolderStack.slice(0, index + 1);
    setDriveFolderStack(newStack);
    const folder = newStack[newStack.length - 1];
    if (driveAccessToken) {
      fetchDriveFiles(driveAccessToken, folder.id);
    }
  };

  const handleGoogleLogout = () => {
    setDriveAccessToken(null);
    setDriveUser(null);
    setDriveFilesTree([]);
    setDriveFolderStack([{ id: 'root', name: 'กูเกิลไดรฟ์ของฉัน' }]);
    setSelectedFile(null);
  };

  // Traverse the tree to find current folder's contents based on path array
  const currentDirectoryContents = useMemo(() => {
    let currentLevel = allFilesTree;
    for (const folderName of currentFolderPath) {
      const found = currentLevel.find(item => item.kind === 'directory' && item.name === folderName);
      if (found && found.children) {
        currentLevel = found.children;
      } else {
        break;
      }
    }
    return currentLevel;
  }, [allFilesTree, currentFolderPath]);

  // Filter items in currently viewed folder
  const filteredContents = useMemo(() => {
    if (!searchQuery) return currentDirectoryContents;
    const lowerQuery = searchQuery.toLowerCase();
    
    // Search is local to current directory or can match recursively if we want:
    // Let's implement active directory filtering first
    return currentDirectoryContents.filter(item => 
      item.name.toLowerCase().includes(lowerQuery)
    );
  }, [currentDirectoryContents, searchQuery]);

  // Filter Google Drive contents
  const filteredDriveContents = useMemo(() => {
    if (!driveSearchQuery) return driveFilesTree;
    const lowerQuery = driveSearchQuery.toLowerCase();
    return driveFilesTree.filter(item => 
      item.name.toLowerCase().includes(lowerQuery)
    );
  }, [driveFilesTree, driveSearchQuery]);

  // Clean up Object URL when selected file changes
  useEffect(() => {
    return () => {
      if (selectedFileBlobUrl) {
        URL.revokeObjectURL(selectedFileBlobUrl);
      }
    };
  }, [selectedFileBlobUrl]);

  // Handle clicking a folder - enters the directory
  const handleFolderClick = (folderName: string) => {
    setCurrentFolderPath([...currentFolderPath, folderName]);
    setSearchQuery('');
  };

  // Go up one level
  const handleGoUp = () => {
    if (currentFolderPath.length > 0) {
      setCurrentFolderPath(currentFolderPath.slice(0, -1));
      setSearchQuery('');
    }
  };

  // Go to a specific index in the breadcrumbs
  const handleBreadcrumbClick = (index: number) => {
    setCurrentFolderPath(currentFolderPath.slice(0, index + 1));
    setSearchQuery('');
  };

  // Handle clicking/opening a file
  const handleFileClick = async (fileItem: FileItem) => {
    setSelectedFile(fileItem);
    setIsPlaying(false);
    setIsVideoPlaying(false);
    setZoomScale(1);
    setRotation(0);
    setTextContent('');

    // Revoke old URL
    if (selectedFileBlobUrl) {
      URL.revokeObjectURL(selectedFileBlobUrl);
      setSelectedFileBlobUrl('');
    }

    // Google Drive File clicked
    if (fileItem.id.startsWith('drive_')) {
      if (!driveAccessToken) return;
      try {
        setTextLoading(true);
        const fileId = fileItem.path;
        const isGoogleDoc = fileItem.type?.startsWith('application/vnd.google-apps.');
        
        let response;
        let mimeTypeToUse = fileItem.type || '';
        
        if (isGoogleDoc) {
          let exportMime = 'application/pdf';
          if (fileItem.type === 'application/vnd.google-apps.document') {
            exportMime = 'text/plain';
          } else if (fileItem.type === 'application/vnd.google-apps.spreadsheet') {
            exportMime = 'text/csv';
          }
          const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`;
          response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${driveAccessToken}` }
          });
          mimeTypeToUse = exportMime;
        } else {
          const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
          response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${driveAccessToken}` }
          });
        }

        if (!response.ok) {
          throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objUrl = URL.createObjectURL(blob);
        setSelectedFileBlobUrl(objUrl);

        // Read text/code files
        const nameLower = fileItem.name.toLowerCase();
        const isText = mimeTypeToUse.startsWith('text/') || 
                       nameLower.endsWith('.txt') || 
                       nameLower.endsWith('.md') ||
                       nameLower.endsWith('.json') || 
                       nameLower.endsWith('.js') || 
                       nameLower.endsWith('.ts') ||
                       nameLower.endsWith('.tsx') || 
                       nameLower.endsWith('.jsx') ||
                       nameLower.endsWith('.html') || 
                       nameLower.endsWith('.css') ||
                       nameLower.endsWith('.sh') || 
                       nameLower.endsWith('.py') ||
                       nameLower.endsWith('.sql') ||
                       mimeTypeToUse === 'text/plain' ||
                       mimeTypeToUse === 'text/csv';

        if (isText && blob.size < 5 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setTextContent(e.target?.result as string || '');
            setTextLoading(false);
          };
          reader.onerror = () => {
            setTextContent('❌ ไม่สามารถอ่านเนื้อหาไฟล์ข้อความนี้ได้');
            setTextLoading(false);
          };
          reader.readAsText(blob);
        } else {
          setTextLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to open Google Drive file:', err);
        setTextContent(`❌ ไม่สามารถเปิดไฟล์นี้ได้: ${err.message || String(err)}`);
        setTextLoading(false);
      }
      return;
    }

    try {
      let fileObj = fileItem.file;
      
      // If we used Directory Access API and the File object isn't fetched yet
      if (!fileObj && fileItem.handle && fileItem.handle.kind === 'file') {
        const fileHandle = fileItem.handle as FileSystemFileHandle;
        fileObj = await fileHandle.getFile();
      }

      if (fileObj) {
        const objUrl = URL.createObjectURL(fileObj);
        setSelectedFileBlobUrl(objUrl);

        // Determine if it is text/code so we can read it
        const nameLower = fileItem.name.toLowerCase();
        const isText = fileObj.type.startsWith('text/') || 
                       nameLower.endsWith('.txt') || 
                       nameLower.endsWith('.md') ||
                       nameLower.endsWith('.json') || 
                       nameLower.endsWith('.js') || 
                       nameLower.endsWith('.ts') ||
                       nameLower.endsWith('.tsx') || 
                       nameLower.endsWith('.jsx') ||
                       nameLower.endsWith('.html') || 
                       nameLower.endsWith('.css') ||
                       nameLower.endsWith('.sh') || 
                       nameLower.endsWith('.py') ||
                       nameLower.endsWith('.sql');

        if (isText && fileObj.size < 5 * 1024 * 1024) { // Only read text files under 5MB
          setTextLoading(true);
          const reader = new FileReader();
          reader.onload = (e) => {
            setTextContent(e.target?.result as string || '');
            setTextLoading(false);
          };
          reader.onerror = () => {
            setTextContent('❌ ไม่สามารถอ่านเนื้อหาไฟล์ข้อความนี้ได้');
            setTextLoading(false);
          };
          reader.readAsText(fileObj);
        }
      }
    } catch (e) {
      console.error('Failed to resolve and open file:', e);
    }
  };

  // Trigger Native opening / Download of files
  const triggerNativeOpen = () => {
    if (!selectedFile) return;
    
    if (selectedFile.webViewLink) {
      const link = document.createElement('a');
      link.href = selectedFile.webViewLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!selectedFileBlobUrl) return;
    
    // Create an anchor tag to trigger safe browser opening/downloading behavior
    const link = document.createElement('a');
    link.href = selectedFileBlobUrl;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get file icon based on its name and extension
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
      return <ImageIcon className="w-8 h-8 text-indigo-400" />;
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext || '')) {
      return <VideoIcon className="w-8 h-8 text-rose-400" />;
    }
    if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'wma'].includes(ext || '')) {
      return <MusicIcon className="w-8 h-8 text-emerald-400" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-8 h-8 text-red-400" />;
    }
    if (['txt', 'md', 'json', 'js', 'ts', 'tsx', 'html', 'css', 'py', 'sh', 'sql', 'yaml', 'yml'].includes(ext || '')) {
      return <FileText className="w-8 h-8 text-sky-400" />;
    }
    return <FileIcon className="w-8 h-8 text-slate-400" />;
  };

  // Sound Player Effects & Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
    };
  }, [selectedFileBlobUrl]);

  // Video Player Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsVideoPlaying(true);
    const onPause = () => setIsVideoPlaying(false);
    const onTimeUpdate = () => setVideoTime(video.currentTime);
    const onDurationChange = () => setVideoDuration(video.duration);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
    };
  }, [selectedFileBlobUrl]);

  // Audio Actions
  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error(e));
    }
  };

  const handleAudioSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (v: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = v;
    setVolume(v);
    if (v > 0 && isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  // Video Actions
  const togglePlayVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isVideoPlaying) {
      video.pause();
    } else {
      video.play().catch(e => console.error(e));
    }
  };

  const handleVideoSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setVideoTime(value);
  };

  // Time format helper (MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // File Categorization check
  const getFileCategory = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext)) return 'video';
    if (ext === 'pdf') return 'pdf';
    if (['txt', 'md', 'json', 'js', 'ts', 'tsx', 'html', 'css', 'py', 'sh', 'sql', 'yaml', 'yml'].includes(ext)) return 'text';
    return 'other';
  };

  const fileCategory = selectedFile ? getFileCategory(selectedFile.name) : 'other';

  return (
    <div className={`w-full min-h-[calc(100vh-140px)] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-800 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
    }`} id="local-file-hub-root">
      
      {/* Invisible HTML Selectors for Directory and File choosing */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        id="native-folder-selector-hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSelectFilesChange}
        multiple
        className="hidden"
        id="native-files-selector-hidden"
      />

      {/* Top Header Panel */}
      <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/50">
              <FolderOpen className="w-5.5 h-5.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                เปิดไฟล์ & มีเดียท้องถิ่น
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  100% Client-Side
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                เข้าถึงโฟลเดอร์หรือไฟล์บนคอมพิวเตอร์ของคุณแบบออฟไลน์ เพื่อเปิดดูรูปภาพ ฟังเพลง เล่นวิดีโอ และเอกสารด้วยความเป็นส่วนตัวสูงสุด
              </p>
            </div>
          </div>
        </div>

        {/* Action Picker Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSelectDirectoryAPI}
            className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2.5 transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
            id="btn-select-folder"
          >
            <FolderOpen className="w-4 h-4" />
            <span>เลือกโฟลเดอร์ในเครื่อง</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/65 text-slate-100 font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95"
            id="btn-select-files"
          >
            <FileIcon className="w-4 h-4 text-slate-300" />
            <span>เลือกไฟล์รายบุคคล</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[550px]">
        
        {/* Left Side: Directory Explorer */}
        <div className="w-full lg:w-3/5 border-r border-slate-800/80 flex flex-col bg-slate-950/40">
          
          {/* Source Selection Tabs */}
          <div className="flex border-b border-slate-850 bg-slate-900/30 p-3 gap-3">
            <button
              onClick={() => { setActiveSource('local'); setSelectedFile(null); }}
              className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold transition-all ${
                activeSource === 'local'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>ไฟล์ในเครื่องคอมพิวเตอร์</span>
            </button>
            <button
              onClick={() => { setActiveSource('drive'); setSelectedFile(null); }}
              className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold transition-all ${
                activeSource === 'drive'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Google Drive</span>
            </button>
          </div>

          {activeSource === 'local' && (
            <>
              {/* Path Navigation & Search Toolbar */}
              {allFilesTree.length > 0 && (
                <div className="p-4 border-b border-slate-800/60 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Directory Path Breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 overflow-x-auto py-1">
                    <button
                      onClick={() => setCurrentFolderPath([])}
                      className="hover:text-white font-medium flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate max-w-[120px]">{rootDirectoryName || 'หน้าแรก'}</span>
                    </button>

                    {currentFolderPath.map((folder, index) => (
                      <React.Fragment key={index}>
                        <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        <button
                          onClick={() => handleBreadcrumbClick(index)}
                          className="hover:text-white font-medium bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors truncate max-w-[120px]"
                        >
                          {folder}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative w-full sm:w-48">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="ค้นหาในโฟลเดอร์..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8.5 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Back / Up Button */}
                    {currentFolderPath.length > 0 && (
                      <button
                        onClick={handleGoUp}
                        className="h-8.5 w-8.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-90"
                        title="ย้อนกลับโฟลเดอร์ก่อนหน้า"
                      >
                        <FolderUp className="w-4 h-4" />
                      </button>
                    )}

                    {/* Grid / List view toggle */}
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="h-8.5 w-8.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                      title={viewMode === 'grid' ? 'แสดงผลแบบตาราง' : 'แสดงผลแบบรายการ'}
                    >
                      {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    </button>
                  </div>

                </div>
              )}

              {/* Directory Content Area */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[600px] lg:max-h-[750px]">
                {allFilesTree.length === 0 ? (
                  // Empty/Init State
                  <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-6">
                    <div className="w-18 h-18 rounded-3xl bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-lg animate-pulse">
                      <FolderOpen className="w-9 h-9 text-indigo-400" />
                    </div>
                    <div className="max-w-md space-y-2">
                      <h3 className="text-lg font-bold text-white">เริ่มต้นเข้าถึงระบบไฟล์เครื่องของคุณ</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        กรุณากดปุ่ม <strong className="text-slate-200 font-semibold">เลือกโฟลเดอร์ในเครื่อง</strong> หรือ <strong className="text-slate-200 font-semibold">เลือกไฟล์รายบุคคล</strong> ด้านบนเพื่อเชื่อมต่อกับโฟลเดอร์จริงๆ และแสดงไฟล์ทั้งหมดอย่างปลอดภัยและเป็นส่วนตัวโดยไม่ต้องผ่านเซิร์ฟเวอร์
                      </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-900/30 px-4 py-2 rounded-xl border border-slate-800/40">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>รองรับการเลือกโฟลเดอร์ขนาดใหญ่พร้อมไฟล์หลายร้อยรายการได้รวดเร็ว</span>
                    </div>
                  </div>
                ) : filteredContents.length === 0 ? (
                  // No Search Results
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Search className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">ไม่พบไฟล์ที่ตรงกับการค้นหา</h4>
                      <p className="text-xs text-slate-500">กรุณาลองระบุคำค้นหาใหม่อีกครั้ง</p>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  // GRID VIEW
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="explorer-grid-container">
                    {filteredContents.map((item) => {
                      const isFolder = item.kind === 'directory';
                      const isSelected = selectedFile?.id === item.id;
                      
                      return (
                        <motion.div
                          key={item.id}
                          onClick={() => isFolder ? handleFolderClick(item.name) : handleFileClick(item)}
                          className={`group p-4 rounded-2xl border flex flex-col items-center text-center cursor-pointer select-none transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-500/10' 
                              : 'border-slate-850 bg-slate-900/25 hover:bg-slate-900/60 hover:border-slate-750'
                          }`}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* Icon container */}
                          <div className="mb-3.5 relative">
                            {isFolder ? (
                              <Folder className="w-12 h-12 text-amber-500 fill-amber-500/20 group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="group-hover:scale-105 transition-transform">
                                {getFileIcon(item.name)}
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <span className="text-xs font-semibold text-slate-200 line-clamp-2 w-full break-all group-hover:text-white transition-colors">
                            {item.name}
                          </span>

                          {/* Size (only for files) */}
                          {!isFolder && (
                            <span className="text-[10px] text-slate-500 font-mono mt-1">
                              {formatBytes(item.size)}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  // LIST VIEW
                  <div className="space-y-1.5" id="explorer-list-container">
                    {filteredContents.map((item) => {
                      const isFolder = item.kind === 'directory';
                      const isSelected = selectedFile?.id === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          onClick={() => isFolder ? handleFolderClick(item.name) : handleFileClick(item)}
                          className={`group w-full h-12 px-4 rounded-xl flex items-center justify-between cursor-pointer border select-none transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-850/40 bg-slate-900/15 hover:bg-slate-900/40 hover:border-slate-800'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3 overflow-hidden mr-4">
                            <div className="flex-shrink-0">
                              {isFolder ? (
                                <Folder className="w-5.5 h-5.5 text-amber-500" />
                              ) : (
                                <div className="scale-75 origin-center">
                                  {getFileIcon(item.name)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            {!isFolder && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {formatBytes(item.size)}
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                              {isFolder ? 'Folder' : item.name.split('.').pop() || 'File'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSource === 'drive' && !driveAccessToken && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 min-h-[400px]">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg relative overflow-hidden">
                <Cloud className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white">เชื่อมต่อกับ Google Drive ของฉัน</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  เข้าถึงและเปิดไฟล์ รูปภาพ เพลง และวิดีโอที่บันทึกไว้ใน Google Drive ของคุณได้โดยตรง ปลอดภัย และสะดวกรวดเร็ว
                </p>
              </div>

              {driveError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/25 max-w-sm">
                  {driveError}
                </p>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={driveLoading}
                className="gsi-material-button group relative overflow-hidden active:scale-95 transition-transform"
                style={{
                  background: 'white',
                  color: '#1f1f1f',
                  borderRadius: '12px',
                  border: '1px solid #dadce0',
                  height: '44px',
                  padding: '0 24px',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              >
                <div className="gsi-material-button-icon flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span>{driveLoading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google Drive'}</span>
              </button>
            </div>
          )}

          {activeSource === 'drive' && driveAccessToken && (
            <>
              {/* Drive Path Navigation & Search Toolbar */}
              <div className="p-4 border-b border-slate-800/60 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Drive Path Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 overflow-x-auto py-1">
                  {driveFolderStack.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                      <button
                        onClick={() => handleDriveBreadcrumbClick(index)}
                        className="hover:text-white font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors truncate max-w-[150px] flex items-center gap-1"
                      >
                        {index === 0 ? <Cloud className="w-3.5 h-3.5 text-indigo-400" /> : null}
                        <span>{folder.name}</span>
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* Drive Actions Toolbar */}
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-44">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      placeholder="ค้นหาไฟล์..."
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      className="w-full h-8.5 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {driveFolderStack.length > 1 && (
                    <button
                      onClick={handleDriveGoUp}
                      className="h-8.5 w-8.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-90"
                      title="ย้อนกลับ"
                    >
                      <FolderUp className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="h-8.5 w-8.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                    title={viewMode === 'grid' ? 'ตาราง' : 'รายการ'}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleGoogleLogout}
                    className="h-8.5 px-3 rounded-lg border border-rose-950 bg-rose-950/20 hover:bg-rose-950/50 text-xs text-rose-400 hover:text-rose-300 transition-all font-semibold"
                    title="ออกจากระบบ"
                  >
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>

              {/* Drive Directory Content Area */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[600px] lg:max-h-[750px]">
                {driveLoading ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400">กำลังโหลดไฟล์จาก Google Drive...</p>
                  </div>
                ) : filteredDriveContents.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Search className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">ไม่พบไฟล์หรือโฟลเดอร์</h4>
                      <p className="text-xs text-slate-500">โฟลเดอร์นี้ว่างเปล่าหรือไม่มีไฟล์ที่ตรงกับการค้นหา</p>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="drive-grid-container">
                    {filteredDriveContents.map((item) => {
                      const isFolder = item.kind === 'directory';
                      const isSelected = selectedFile?.id === item.id;
                      
                      return (
                        <motion.div
                          key={item.id}
                          onClick={() => isFolder ? handleDriveFolderClick(item.path, item.name) : handleFileClick(item)}
                          className={`group p-4 rounded-2xl border flex flex-col items-center text-center cursor-pointer select-none transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-500/10' 
                              : 'border-slate-850 bg-slate-900/25 hover:bg-slate-900/60 hover:border-slate-750'
                          }`}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className="mb-3.5 relative">
                            {isFolder ? (
                              <Folder className="w-12 h-12 text-indigo-400 fill-indigo-400/20 group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="group-hover:scale-105 transition-transform">
                                {getFileIcon(item.name)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-200 line-clamp-2 w-full break-all group-hover:text-white transition-colors">
                            {item.name}
                          </span>
                          {!isFolder && (
                            <span className="text-[10px] text-slate-500 font-mono mt-1">
                              {formatBytes(item.size)}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5" id="drive-list-container">
                    {filteredDriveContents.map((item) => {
                      const isFolder = item.kind === 'directory';
                      const isSelected = selectedFile?.id === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          onClick={() => isFolder ? handleDriveFolderClick(item.path, item.name) : handleFileClick(item)}
                          className={`group w-full h-12 px-4 rounded-xl flex items-center justify-between cursor-pointer border select-none transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-850/40 bg-slate-900/15 hover:bg-slate-900/40 hover:border-slate-800'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3 overflow-hidden mr-4">
                            <div className="flex-shrink-0">
                              {isFolder ? (
                                <Folder className="w-5.5 h-5.5 text-indigo-400" />
                              ) : (
                                <div className="scale-75 origin-center">
                                  {getFileIcon(item.name)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            {!isFolder && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {formatBytes(item.size)}
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                              {isFolder ? 'Folder' : item.name.split('.').pop() || 'File'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Right Side: File Media Previewer */}
        <div className="w-full lg:w-2/5 flex flex-col bg-slate-950/60 relative border-t lg:border-t-0 border-slate-800">
          
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              // No Selected File
              <motion.div
                key="no-selection"
                className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-14 h-14 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">เครื่องเปิดเล่นสื่อและพรีวิวไฟล์</h4>
                  <p className="text-xs text-slate-500">
                    เลือกรูปภาพ, ไฟล์เพลง (MP3), ไฟล์ PDF หรือวิดีโอจากทางด้านซ้ายเพื่อเปิดเล่นหรือพรีวิวได้ทันทีบนบราวเซอร์
                  </p>
                </div>
              </motion.div>
            ) : (
              // Selected File Preview Interface
              <motion.div
                key={selectedFile.id}
                className="flex-1 flex flex-col h-full overflow-hidden"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                
                {/* File Preview Header */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex-shrink-0 p-1.5 bg-slate-850 rounded-lg border border-slate-850">
                      {isFolderIcon(selectedFile) ? (
                        <Folder className="w-4 h-4 text-amber-500" />
                      ) : (
                        <div className="scale-50 origin-center -m-2">
                          {getFileIcon(selectedFile.name)}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* File Preview Body Content */}
                <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col justify-between">
                  
                  {/* Dynamic Viewer based on category */}
                  <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-[350px]">
                    
                    {/* IMAGE PREVIEWER */}
                    {fileCategory === 'image' && selectedFileBlobUrl && (
                      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-4">
                        <div 
                          className={`w-full max-h-[320px] rounded-xl overflow-hidden border border-slate-850 relative flex items-center justify-center bg-slate-900 ${
                            checkerboardBg ? 'bg-checkerboard' : ''
                          }`}
                          style={{
                            backgroundImage: checkerboardBg 
                              ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)'
                              : 'none',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                          }}
                        >
                          <img
                            src={selectedFileBlobUrl}
                            alt={selectedFile.name}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-[300px] object-contain transition-transform"
                            style={{
                              transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                            }}
                          />
                        </div>

                        {/* Image Manipulation Controls */}
                        <div className="flex items-center gap-2.5 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-md">
                          <button
                            onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="ซูมออก"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-slate-300 min-w-[40px] text-center">
                            {Math.round(zoomScale * 100)}%
                          </span>
                          <button
                            onClick={() => setZoomScale(Math.min(3, zoomScale + 0.25))}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="ซูมเข้า"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <div className="w-[1px] h-3.5 bg-slate-800" />
                          <button
                            onClick={() => setRotation((rotation + 90) % 360)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="หมุนรูปภาพ 90 องศา"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCheckerboardBg(!checkerboardBg)}
                            className={`p-1 rounded text-[10px] font-bold ${
                              checkerboardBg ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="สลับโหมดตารางโปร่งใส"
                          >
                            PNG Grid
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AUDIO MUSIC PLAYER */}
                    {fileCategory === 'audio' && selectedFileBlobUrl && (
                      <div className="w-full flex flex-col items-center justify-center py-6 px-4 space-y-6">
                        
                        {/* Audio Source Element */}
                        <audio ref={audioRef} src={selectedFileBlobUrl} />

                        {/* Spinning Album Vinyl Graphic */}
                        <div className="relative">
                          <div className={`w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-2xl relative overflow-hidden ${
                            isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
                          }`}>
                            {/* Grooves */}
                            <div className="absolute inset-2 rounded-full border border-slate-800/40" />
                            <div className="absolute inset-4 rounded-full border border-slate-800/30" />
                            <div className="absolute inset-8 rounded-full border border-slate-800/20" />
                            
                            {/* Center Vinyl Label */}
                            <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-slate-950 z-10">
                              <MusicIcon className="w-4 h-4 text-indigo-200" />
                            </div>
                          </div>
                          
                          {/* Tone arm needle */}
                          <div className={`absolute top-0 -right-2 w-8 h-12 origin-top-left transition-transform duration-500 transform ${
                            isPlaying ? 'rotate-[15deg]' : 'rotate-0'
                          }`}>
                            <div className="w-[2px] h-10 bg-slate-500 ml-3" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full ml-2" />
                          </div>
                        </div>

                        {/* Custom Player Controls */}
                        <div className="w-full space-y-4">
                          
                          {/* Seek bar */}
                          <div className="space-y-1">
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              value={currentTime}
                              onChange={(e) => handleAudioSeek(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                          </div>

                          {/* Control Buttons row */}
                          <div className="flex items-center justify-between gap-4">
                            
                            {/* Volume Control */}
                            <div className="flex items-center gap-2 w-28">
                              <button
                                onClick={toggleMute}
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                              />
                            </div>

                            {/* Main Play Toggle */}
                            <button
                              onClick={togglePlayAudio}
                              className="w-11 h-11 rounded-full bg-white text-slate-950 hover:bg-slate-100 flex items-center justify-center transition-transform active:scale-90 shadow-md"
                            >
                              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                            </button>

                            {/* Standard Native Badge */}
                            <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
                              MP3 AUDIO
                            </span>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* VIDEO PLAYER */}
                    {fileCategory === 'video' && selectedFileBlobUrl && (
                      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-4">
                        <div className="w-full max-h-[300px] aspect-video bg-black rounded-xl overflow-hidden border border-slate-850 relative group">
                          <video
                            ref={videoRef}
                            src={selectedFileBlobUrl}
                            className="w-full h-full object-contain"
                            onClick={togglePlayVideo}
                          />
                        </div>

                        {/* Video Controls overlay */}
                        <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                          <input
                            type="range"
                            min="0"
                            max={videoDuration || 100}
                            value={videoTime}
                            onChange={(e) => handleVideoSeek(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={togglePlayVideo}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95"
                              >
                                {isVideoPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />}
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatTime(videoTime)} / {formatTime(videoDuration)}
                              </span>
                            </div>

                            <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-rose-400 font-mono">
                              VIDEO MEDIA
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PDF DOCUMENT VIEWER */}
                    {fileCategory === 'pdf' && selectedFileBlobUrl && (
                      <div className="w-full h-full min-h-[340px] flex flex-col rounded-xl overflow-hidden border border-slate-850 bg-slate-900">
                        <object
                          data={selectedFileBlobUrl}
                          type="application/pdf"
                          className="w-full h-[300px] md:h-[340px] rounded-t-xl"
                        >
                          <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                            <p>โปรแกรมพรีวิว PDF ในตัวบราวเซอร์ไม่รองรับ แนะนำให้เปิดผ่านระบบหลักของเครื่องคอมพิวเตอร์ของคุณ</p>
                            <button
                              onClick={triggerNativeOpen}
                              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                            >
                              ดาวน์โหลด / เปิด PDF ทันที
                            </button>
                          </div>
                        </object>
                        <div className="p-2.5 bg-slate-950 text-center border-t border-slate-850 flex items-center justify-between px-4">
                          <span className="text-[10px] text-slate-400">พรีวิวไฟล์เอกสาร PDF ท้องถิ่น</span>
                          <button
                            onClick={triggerNativeOpen}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>เปิดเต็มหน้าจอ</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TEXT AND CODE VIEWER */}
                    {fileCategory === 'text' && (
                      <div className="w-full h-full min-h-[300px] flex flex-col rounded-xl border border-slate-850 overflow-hidden bg-slate-950">
                        {textLoading ? (
                          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>กำลังอ่านข้อมูลในไฟล์...</span>
                          </div>
                        ) : (
                          <pre className="flex-1 p-4 overflow-auto max-h-[280px] font-mono text-[11px] text-slate-300 leading-relaxed text-left select-text selection:bg-indigo-500/30">
                            <code>{textContent || '// ไฟล์นี้ไม่มีข้อความอยู่ข้างใน'}</code>
                          </pre>
                        )}
                        <div className="p-2 bg-slate-900 border-t border-slate-850 text-center text-[10px] text-slate-500 font-mono">
                          TEXT & CODE VIEWER (READ-ONLY)
                        </div>
                      </div>
                    )}

                    {/* OTHER FILES NOT DIRECTLY SUPPORTED */}
                    {fileCategory === 'other' && (
                      <div className="p-6 text-center max-w-sm space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-md">
                          <FileIcon className="w-7 h-7 text-slate-500" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold text-white">ไฟล์ประเภทนี้ไม่รองรับพรีวิวบนเว็บ</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            เนื่องจากข้อจำกัดความปลอดภัยของเว็บเบราว์เซอร์ เพื่อความปลอดภัยสูงสุด กรุณากดปุ่มเปิดไฟล์ด้านล่างเพื่อรันและเรียกเปิดใช้งานบนเครื่องคอมพิวเตอร์ของคุณโดยตรง
                          </p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Native Open Trigger Action Footer */}
                  <div className="p-4 border-t border-slate-850 bg-slate-900/30 flex flex-col space-y-3 flex-shrink-0">
                    <button
                      onClick={triggerNativeOpen}
                      className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98"
                    >
                      <Download className="w-4 h-4 text-slate-300" />
                      <span>เปิดและเรียกใช้บนระบบหลักของเครื่อง</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      * ระบบจะดึงไฟล์ขึ้นมาและแจ้งเตือนให้คุณบันทึกหรือเปิดทำงานผ่านซอฟต์แวร์หลักของระบบปฏิบัติการคอมพิวเตอร์ของคุณอย่างปลอดภัย
                    </p>
                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}

// Check if file object holds folder state
function isFolderIcon(file: FileItem) {
  return file.kind === 'directory';
}
