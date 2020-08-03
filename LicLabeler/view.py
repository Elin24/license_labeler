# -*- coding: utf-8 -*-

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
from . import utils

def login(request, errorlogin=0, nologin=0):
    context = dict(error=errorlogin, nologin=nologin)
    return render(request, 'login.html', context)

@csrf_exempt
def table(request):
    name = request.POST.get('user')
    pasd = request.POST.get('password')
    if (name == None):
        return login(request)
    player = utils.Player(name)
    if not player.testPsd(pasd):
        return login(request, errorlogin=1)
    context = dict(
        username = player.name,
        datalist = player.datalist()
    )
    return render(request, 'table.html', context)

@csrf_exempt
def label(request):
    name = request.POST.get('user')
    videoName = request.POST.get('videoName')
    context = dict(
        name = name,
        framedir = videoName,
        videoLen = utils.getVideoLen(videoName)
    )
    return render(request, 'label.html', context)
    

@csrf_exempt
def requireAll(request):
    videoName = request.POST.get('videoName')
    context = utils.getAllInfo(videoName)
    return HttpResponse(json.dumps(context), content_type='application/json')
    
@csrf_exempt
def saveAll(request):
    videoName = request.POST.get('videoName')
    labelInfo = request.POST.get('labelInfo')
    saveType = request.POST.get('saveType')
    context = utils.saveAllInfo(videoName, json.loads(labelInfo), json.loads(saveType))

    name = request.POST.get('name')
    progress = request.POST.get('progress')
    player = utils.Player(name)
    player.labelProgress(videoName, progress)

    if(progress == 'done'):
        context = dict(
            success = True,
            user = player.name,
            password = player.password
        )
    return HttpResponse(json.dumps(context), content_type='application/json')

@csrf_exempt
def summary(request):
    users = utils.getAllUsers()
    userlist = []
    for user in users:
        player = utils.Player(user)
        lfnum, cnum, scnum = player.labelnum()
        userlist.append(dict(
            username = player.name,
            donenum = len(player.done),
            halfnum = len(player.half),
            undonum = len(player.data) - len(player.half) - len(player.done),

            labelframenum = lfnum,
            allframenum = player.allframenum(),

            carnum = cnum,
            spcarnum = scnum
        ))
    context = dict(
        playerlist = userlist,
        height = len(userlist) * 40 + 150
    )
    return render(request, 'summary.html', context)
