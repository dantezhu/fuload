#!/usr/bin/python
# -*- coding: utf-8 -*-
from os.path import abspath, dirname, join
import logging
import random

from ipc import ipc

from fl_slave_wkmng import WorkerManager
from fl_slave_conf import WORKER_NUM,INPUT_FILE,SO_FILE,REPORT_TIMESEC
from fl_slave_msg import SlaveMsg

logging.basicConfig(level=logging.DEBUG,
        format='%(asctime)s %(levelname)s %(message)s',
        filename='./log.txt',
        filemode='a+')

class SlaveCtrl(object):
    _slaveMsg = None

    def __init__(self):
        pass

    def createMsgQKey(self):
        '''
        找一个没有用过的msgkey
        '''
        MaxKey = 0x0000FFFF

        getOne = False
        while not getOne:
            ipc_key = random.randint(0x01,MaxKey)
            msg_id = ipc.msgget(ipc_key,0666)
            if 0 > msg_id:
                #find it!
                return ipc_key

    def start(self):
        msgQKey = self.createMsgQKey()
        if msgQKey < 0:
            return -1;
        self._slaveMsg = SlaveMsg(msgQKey)
        WorkerManager.fork(
                [ 
                    "./fl_slave_worker",
                    "-i"+INPUT_FILE,
                    "-r"+str(REPORT_TIMESEC),
                    "-s"+SO_FILE,
                    "-m"+str(msgQKey),
                    ],
                WORKER_NUM
                )
        WorkerManager.wait();

if __name__ == "__main__":
    srv = SlaveCtrl()
    srv.start()
