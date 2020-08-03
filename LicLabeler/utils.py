# -*- coding: utf-8 -*-

import os
import json
from . import settings
import glob

dataroot = os.path.join(settings.BASE_DIR, 'data')
videodir = os.path.join(dataroot, 'video')
jsondir = os.path.join(dataroot, 'json')
userdir = os.path.join(dataroot, 'user')
typedir = os.path.join(dataroot, 'type')

def readjs(jspath):
    with open(jspath, encoding='utf-8') as f:
        return json.load(f)

def writejs(jsinfo, jspath):
    with open(jspath, 'w+', encoding='utf-8') as f:
        json.dump(jsinfo, f, ensure_ascii=False)

def getAllInfo(videoName):
    jsfold = os.path.join(jsondir, videoName)
    labels = {}
    labelTypes = {}
    if os.path.exists(jsfold):
        for basejsf in os.listdir(jsfold):
            jsf = os.path.join(jsfold, basejsf)
            if os.path.exists(jsf):
                idx = basejsf.replace('frame', '').replace('.json', '')
                labels[idx] = readjs(jsf)
    
    typejs = os.path.join(typedir, f'{videoName}.json')
    if os.path.exists(typejs):
        labelTypes = readjs(typejs)
    
    return dict(
        labels=labels,
        labelTypes=labelTypes
    )

def saveAllInfo(videoName, labelInfo, saveTypes):
    jsfold = os.path.join(jsondir, videoName)
    os.makedirs(jsfold, exist_ok=True)
    for frame, label in labelInfo.items():
        writejs(label, os.path.join(jsfold, f'frame{frame}.json'))

    os.makedirs(typedir, exist_ok=True)
    writejs(saveTypes, os.path.join(typedir, f'{videoName}.json'))
    return dict(success=True)

def getVideoLen(videoName):
    return len(glob.glob(os.path.join(videodir, videoName, '*.jpg')))

def getAllUsers():
    return [jsf.replace('.json', '') for jsf in os.listdir(userdir)]

class Player():
    def __init__(self, name='root'):
        self.name = name
        self.password = None
        self.data, self.done, self.half = [], set(), set()
        jsonfile = os.path.join(userdir, name + '.json')
        if os.path.exists(jsonfile):
            with open(jsonfile) as f:
                userInfo = json.load(f)
                self.password = userInfo['password']
                self.data = userInfo['data']
                self.done = set(userInfo['done'])
                self.half = set(userInfo['half'])
    
    def testPsd(self, psd):
        return self.password != None and psd == self.password
    
    def datalist(self, colnum=10):
        videoTable, videoRow = [], []
        for videoName in self.data:
            if videoName in self.done:
                ltype = "done"
            elif videoName in self.half:
                ltype = "half"
            else:
                ltype = "default"
            videoRow.append(dict(
                ltype = ltype,
                name = videoName,
            ))
            if len(videoRow) >= colnum:
                videoTable.append(videoRow)
                videoRow = []
        if len(videoRow) > 0:
            while len(videoRow) < colnum:
                videoRow.append(dict(
                    ltype = 'default',
                    name = ''
                ))
            videoTable.append(videoRow)
        return videoTable
    
    def labelProgress(self, videoName, progress):
        videoName = int(videoName)
        if(videoName in self.data):
            if progress == 'done':
                self.half.discard(videoName)
                self.done.add(videoName)
            elif progress == 'half':
                self.done.discard(videoName)
                self.half.add(videoName)
            self.info2js()
    
    def info2js(self):
        jsonfile = os.path.join(userdir, self.name + '.json')
        with open(jsonfile, 'w+') as f:
            json.dump(dict(
                name = self.name,
                password = self.password,
                data = self.data,
                done = list(self.done),
                half = list(self.half)
            ), f)
    
    def allframenum(self):
        ans = 0
        for videoName in self.data:
            videopath = os.path.join(videodir, str(videoName))
            if os.path.exists(videopath):
                ans += len(os.listdir(videopath))
        return ans
    
    def labelnum(self):
        framenum, carnum, spcarnum = 0, 0, 0
        for video in (self.done | self.half):
            video = str(video)
            videojsdir = os.path.join(jsondir, video)
            if not os.path.exists(videojsdir):
                continue
            carids = []
            for jsf in os.listdir(videojsdir):
                jsf = os.path.join(jsondir, video, jsf)
                if not os.path.exists(jsf):
                    continue
                with open(jsf) as f:
                    cars = json.load(f)
                    tcnum = len(cars)
                    if tcnum > 0:
                        framenum += 1
                        carnum += tcnum
                    carids += cars.keys()
            spcarnum += len(set(carids))

        return framenum, carnum, spcarnum
