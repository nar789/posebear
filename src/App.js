import './App.css';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
// Register one of the TF.js backends.
import '@tensorflow/tfjs-backend-webgl';
import * as mpPose from '@mediapipe/pose';
import { useEffect, useRef } from 'react';
import { initializers } from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-backend-wasm';

export const DEFAULT_LINE_WIDTH = 2;
export const DEFAULT_RADIUS = 4;


async function init(videoRef, ctxRef) {
  const ctx = ctxRef.current.getContext('2d');
  const model = poseDetection.SupportedModels.MoveNet;
  let detector = await poseDetection.createDetector(model);
  const video  = videoRef.current;
  

  await cameraSetup(video, ctxRef, ctx);

  setInterval(async ()=>{
    await render(detector, ctx, video, ctxRef);    
  },100);
/*
  requestAnimationFrame(async ()=> {
    
  });*/

}

async function render(detector, ctx, video, ctxRef) {

  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);


  let poses = null;
  if(detector != null) {
    try {
      poses = await detector.estimatePoses(
        video,
          {maxPoses: 1, flipHorizontal: false});

      if (poses && poses.length > 0) {
        await drawResults(ctx, poses);
      }
    } catch (error) {
      detector.dispose();
      detector = null;
      alert(error);
    }
  }

}

function drawResults(ctx, poses) {
  //console.log(poses);
  for (const pose of poses) {
    drawResult(ctx, pose);
  }
}

function drawResult(ctx, pose) {
  if (pose.keypoints != null) {
    drawKeypoints(ctx, pose.keypoints);
    drawSkeleton(ctx, pose.keypoints, pose.id);
  }
}

function drawKeypoints(ctx, keypoints) {
  const keypointInd =
      poseDetection.util.getKeypointIndexBySide(poseDetection.SupportedModels.MoveNet);
  ctx.fillStyle = 'Red';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = DEFAULT_LINE_WIDTH;


  for (const i of keypointInd.middle) {
    drawKeypoint(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Green';
  for (const i of keypointInd.left) {
    drawKeypoint(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Orange';
  for (const i of keypointInd.right) {
    drawKeypoint(ctx, keypoints[i]);
  }
}

function drawKeypoint(ctx, keypoint) {
  // If score is null, just show the keypoint.
  const score = keypoint.score != null ? keypoint.score : 1;
  const scoreThreshold = 0.3;

  if (score >= scoreThreshold) {
    const circle = new Path2D();
    circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
    ctx.fill(circle);
    ctx.stroke(circle);
  }
}

function drawSkeleton(ctx, keypoints, poseId) {
  // Each poseId is mapped to a color in the color palette.
  const color = 'White';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = DEFAULT_LINE_WIDTH;

  poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet).forEach(([
                                                                    i, j
                                                                  ]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];
    // If score is null, just show the keypoint.
    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;
    const scoreThreshold = 0.3 || 0;

    if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });
}


async function cameraSetup(video, ctxRef, ctx) {

  const videoConfig = {
    'audio': false,
    'video': {
      facingMode: 'user',
      // Only setting the video to a specified size for large screen, on
      // mobile devices accept the default size.
      width: 360,
      height: 270,
      frameRate: {
        ideal: 60,
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
  //console.log(stream);
  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });

  video.play();

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  ctxRef.current.width = videoWidth;
  ctxRef.current.height = videoHeight;



  ctx.translate(video.videoWidth, 0);
  ctx.scale(-1, 1);

  return video;

}

function App() {

  const videoRef = useRef();
  const ctxRef = useRef();

  useEffect(()=>{

    init(videoRef, ctxRef);

  },[]);

  


  return (
    <div className="App">
      <h2>pose bear by jh0511.lee</h2>
      <div>
        <canvas ref={ctxRef} className='poseCanvas'></canvas>
        <video ref={videoRef} autoPlay muted playsInline className='posevideo'></video>
      </div>
      
    </div>
  );
}

export default App;
