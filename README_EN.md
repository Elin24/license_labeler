#   License Plate Labeler

License Plate Labeler is a labeling tool for vehicles and license plates in videos that can be quickly deployed. Supports *box labeling* and license plate *point labeling*, and this tool can also be used for target labeling in videos in other projects.


----

### Request
* Python 3.+
* Django(pip install django)
* nginx(It is recommended to install when high concurrency)


------

###Characteristic
1. Easy to deploy, workload can be distributed to achieve multi-person labeling
2. The tool contains a linear interpolation function, which can be marked every multiple frames, which reduces the workload relatively

----



### How to run

1. clone the repository to local workspace:

*   git clone https://github.com/Elin24/lplabeler.git

*   cd lplabeler

2. Create four folders under the data folder: `user`, `video`, `type` and `json`. Among them, the files in the `json` folder store the annotation results, and the `type` folder is the file for auxiliary annotation, and there is no need to operate it. The `video` folder is used to store the video frames that need to be marked, the specific format is as follows：
```
video
│  
├─1
│      frame1.jpg
│      frame2.jpg
│      frame3.jpg
│      ...
├─2
│      frame1.jpg
│      frame2.jpg
│      frame3.jpg
│      ...
└─3
│      frame1.jpg
│      frame2.jpg
│      frame3.jpg
│      ...
└─ ...
```
Write the label of the folder (1, 2, 3,...) under the corresponding user



3. Mark account settings
```json
{
    "name": "root",
    "password": "root",
    "data": [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "done": [],
    "half": []
}
```
`name` represents the login name, `password` represents the login password, and the `data` folder represents the folder label of the video frame that the user needs to mark. `done` and `half` indicate the video that has been marked and that is being marked respectively. Leave it blank initially.


4. Run django service

*   python manage.py runserver 0.0.0.0:8000

5. Open localhost:8000 with Chrome browser, log in to the account and start marking


----


### User instructions

1. Click `new` and drag the mouse to mark a car
2. The four points inside are used to mark the four corners of the license plate
3. Use `Ctrl+wheel` to zoom in and out of the picture, and use `WASD` to adjust the zoom position
4. After marking the coordinate points, enter the license plate number in the `input box` at the upper right corner
5. The newly created label box will be automatically copied to the next frame. In order to reduce the workload, you only need to make fine adjustments later. When you need to stop labeling of the car, click `delete` to automatically delete the box in all frames after the current frame
5. It can be modified at intervals of several frames, and the middle part will be automatically linearly interpolated
6. After modifying a certain frame, be sure to **save** by clicking the `save` key or on the keyboard `ctrl + S`
7. The left is the corresponding frame, you can use the `wheel` to adjust the frame up and down;
8. When moving to the last frame, the bottom progress bar changes back to a button, asking if it has been marked. If you have finished marking, you can click to jump to the main interface; otherwise, you can ignore it.

---



### Summary
Log in to http://localhost:8000/summary to get the status and progress of all annotators
