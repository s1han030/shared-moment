import React, { useState } from 'react';
import { C } from './lib/constants.js';
import { PlanHome }      from './screens/PlanHome.jsx';
import { CreateEvent }   from './screens/CreateEvent.jsx';
import { EventDetail }   from './screens/EventDetail.jsx';
import { ShootCamera }   from './screens/ShootCamera.jsx';
import { AfterReflect }  from './screens/AfterReflect.jsx';
import { Library }       from './screens/Library.jsx';
import { GuideHome }     from './screens/GuideHome.jsx';
import { Profile }       from './screens/Profile.jsx';

export default function App() {
  const [screen, setScreen] = useState('planHome');
  const [activeRef, setActiveRef] = useState(null);
  const [uploadedRefs, setUploadedRefs] = useState([]);

  const goTo = (s) => setScreen(s);

  const shootWithRef = (refItem) => {
    setActiveRef(refItem);
    setScreen('shootCamera');
  };

  const handleNav = (tab) => {
    if (tab === 'plan')    setScreen('planHome');
    if (tab === 'shoot')   setScreen('shootCamera');
    if (tab === 'library') setScreen('library');
    if (tab === 'profile') setScreen('profile');
    if (tab === 'guide')   setScreen('guideHome');
  };

  const screens = {
    planHome:    <PlanHome     onNav={handleNav} onGoTo={goTo} />,
    createEvent: <CreateEvent  onBack={() => setScreen('planHome')} onGoTo={goTo} />,
    eventDetail: <EventDetail  onBack={() => setScreen('planHome')} onGoTo={goTo} onNav={handleNav} />,
    shootCamera: <ShootCamera  onBack={() => setScreen('eventDetail')} onGoTo={goTo}
                               initialRef={activeRef} uploadedRefs={uploadedRefs} />,
    afterReflect:<AfterReflect onNav={handleNav} onBack={() => setScreen('planHome')} />,
    library:     <Library      onBack={() => setScreen('planHome')} onNav={handleNav}
                               onShootWithRef={shootWithRef}
                               uploadedRefs={uploadedRefs} setUploadedRefs={setUploadedRefs} />,
    guideHome:   <GuideHome    onNav={handleNav} onGoTo={goTo} />,
    profile:     <Profile      onNav={handleNav} />,
  };

  return (
    <>
      <style>{`
        .app-wrapper {
          min-height: 100vh;
          background: #E8E6E0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          font-family: 'DM Sans', sans-serif;
          flex-direction: column;
          gap: 20px;
        }
        .phone-shell {
          width: 402px;
          height: 874px;
          background: #FFFFFF;
          border-radius: 54px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 40px 120px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
        }
        .hint-text {
          font-size: 12px;
          color: #6B6A64;
          margin: 0;
          text-align: center;
        }
        /* On small screens: fill the full viewport, no phone chrome */
        @media (max-width: 480px) {
          .app-wrapper {
            padding: 0;
            gap: 0;
            align-items: stretch;
            justify-content: flex-start;
          }
          .screen-switcher { display: none !important; }
          .phone-shell {
            width: 100%;
            height: 100dvh;
            border-radius: 0;
            box-shadow: none;
          }
          .hint-text { display: none; }
        }
      `}</style>
      <div className="app-wrapper">
        {/* Phone shell */}
        <div className="phone-shell">
          {screens[screen]}
        </div>

      </div>
    </>
  );
}
