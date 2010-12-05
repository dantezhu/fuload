#!/usr/bin/python
# -*- coding: utf-8 -*-

import time
import datetime
from comm_def import split_minutes,rtype2attr

def get_border_time(now_time):
    '''
    now_time = datetime.datetime.now()
    通过给定时间，获取所处的区段，及距离两端的比例
    '''
    #分割时间为5分钟

    now_tup = now_time.timetuple()

    #5分钟之内的分割
    first_min = now_tup.tm_min - int(now_tup.tm_min / split_minutes) * split_minutes
    second_min = split_minutes - first_min

    t = datetime.timedelta(minutes=first_min)
    first_time = now_time - t
    first_time = datetime.datetime(*first_time.timetuple()[:5])

    t = datetime.timedelta(minutes=second_min)
    second_time = now_time + t
    second_time = datetime.datetime(*second_time.timetuple()[:5])

    now_stamp = time.mktime(now_time.timetuple())
    first_stamp = time.mktime(first_time.timetuple())
    second_stamp = time.mktime(second_time.timetuple())

    first_distance = now_stamp - first_stamp
    second_distance = second_stamp - now_stamp

    return {
            'first_time':first_time,
            'second_time':second_time,
            'first_distance':first_distance,
            'second_distance':second_distance,
            }


def get_pre_time(now_time):
    '''
    通过给定时间，获取split_minutes之前的是时间
    '''
    t = datetime.timedelta(minutes=split_minutes)
    pre_time = now_time - t
    return pre_time

def calc_values(report_info):
    result = {}

    #平均到每秒
    result['allAvgNum'] = report_info['allReqNum']/(split_minutes * 60)
    result['sucAvgNum'] = report_info['sucReqNum']/(split_minutes * 60)
    result['errAvgNum'] = report_info['errReqNum']/(split_minutes * 60)

    result['allAvgTime'] = report_info['allTimeMsStat'] / report_info['allReqNum']
    result['sucAvgTime'] = report_info['sucTimeMsStat'] / report_info['sucReqNum']
    result['errAvgTime'] = report_info['errTimeMsStat'] / report_info['errReqNum']

    result['sucRate'] = float(report_info['sucReqNum']) / float(report_info['allReqNum'])
    result['errRate'] = float(report_info['errReqNum']) / float(report_info['allReqNum'])

    return result

#仅仅是把数据查找出来没有做进一步的处理
def get_report_objs(cd):
    from models import StatDetail
    objs = StatDetail.objects.filter(reportId=cd['reportid'])

    if 'clientip' in cd and cd['clientip'] is not None:
        objs = objs.filter(clientIp=cd['clientip'])

    if 'begintime' in cd and cd['begintime'] is not None:
        objs = objs.filter(firstTime__gte=cd['begintime'])

    if 'endtime' in cd and cd['endtime'] is not None:
        objs = objs.filter(secondTime__lte=cd['endtime'])

    objs.order_by('firstTime')

    return objs

def get_report_data_line(cd):
    from models import StatDetail

    objs = get_report_objs(cd)

    if objs is None or len(objs) == 0:
        return []

    rtype = cd['rtype']

    begintime = objs[0].firstTime
    endtime = objs[len(objs)-1].firstTime

    data = []
    t = datetime.timedelta(minutes=split_minutes)
    d = begintime+t
    while d < (endtime - t):
        dict_d = {}
        dict_d['x']=d
        try:
             obj = objs.get(firstTime=d)
        except StatDetail.DoesNotExist:
            dict_d['y'] = ''
        else:
            dict_d['y'] = getattr(obj,rtype2attr[rtype]['attr'])
            dict_d['y'] = rtype2attr[rtype]['accuracy'] % (dict_d['y'])
        data.append(dict_d)
        d = d+t
    return data

def get_report_data_pie(cd):
    objs = get_report_objs(cd)

    if objs is None or len(objs) == 0:
        return []
    rtype = cd['rtype']

    data_map = {}
    for obj in objs:
        report_info = eval(obj.reportInfo)
        single_map = report_info[rtype]
        for k,v in single_map.items():
            if k in data_map:
                data_map[k] += v
            else:
                data_map[k] = v

    tmp_data = []
    for k,v in data_map.items():
        dict_d = {
                'name':k,
                'value':v
                }
        tmp_data.append(dict_d)

    tmp_data.sort(lambda x,y: cmp(y['value'], x['value']))   
    res_data = tmp_data[:6]

    if len(tmp_data) > 6:
        sum_d = 0
        for i in range(6,len(tmp_data)):
            sum_d += tmp_data[i]['value']
        res_data.append({'name':'else','value':sum_d})

    sum_value = 0
    for v in res_data:
        sum_value+=v['value']

    colors = ('004CB0','EC0033','FF7300','999999','00B869','FFCD00','A0D300')
    for i in range(0,len(res_data)):
        res_data[i]['color'] = colors[i]
        res_data[i]['value'] = rtype2attr[rtype]['accuracy'] % (res_data[i]['value'] * 100 / sum_value)

    return res_data

if __name__ == '__main__':
    print get_border_time(datetime.datetime.now())
    #print get_pre_time(datetime.datetime.now())