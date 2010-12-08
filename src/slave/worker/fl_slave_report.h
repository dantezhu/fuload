/*=============================================================================
#  Author:          dantezhu - http://www.vimer.cn
#  Email:           zny2008@gmail.com
#  FileName:        fl_slave_report.h
#  Description:     
#  Version:         1.0
#  LastChange:      2010-12-03 00:25:24
#  History:         
=============================================================================*/
#ifndef _FL_SLAVE_REPORT_H_
#define _FL_SLAVE_REPORT_H_
#include <iostream>
#include <string>
#include <map>

#include <json/json.h>

#include "fl_commdef.h"
#include "stat.h"
#include "stat_def.h"
using namespace std;

//为report准备的统计数据
typedef struct _StSWNetStat
{
    public:
        //统计了不同时间状态的调用数量
        map<string, unsigned> mapAllTimeMsStat;
        map<string, unsigned> mapSucTimeMsStat;
        map<string, unsigned> mapErrTimeMsStat;

        //所有请求的累计调用时间
        unsigned allTimeMsStat;
        //成功请求的累计调用时间
        unsigned sucTimeMsStat;
        //失败请求的累计调用时间
        unsigned errTimeMsStat;

        //所有请求的数量
        unsigned allReqNum;
        //成功请求的数量
        unsigned sucReqNum;
        //失败请求的数量
        unsigned errReqNum;

        //统计返回码的调用数量
        map<int,unsigned> mapRetcodeStat;

        _StSWNetStat()
        {
            ResetStat();
        }

        void AddCount(int retcode,int time_ms)
        {
            ++allReqNum;
            allTimeMsStat += time_ms;

            if (retcode == 0)
            {
                ++sucReqNum;
                sucTimeMsStat += time_ms;
            }
            else
            {
                ++errReqNum;
                errTimeMsStat += time_ms;
            }
            mapRetcodeStat[retcode] += 1;
            string mTime = get_maptime(time_ms);
            mapAllTimeMsStat[mTime] += 1;
            if (retcode == 0)
            {
                mapSucTimeMsStat[mTime] += 1;
            }
            else
            {
                mapErrTimeMsStat[mTime] += 1;
            }
        }
        void ResetStat()
        {
            mapAllTimeMsStat.clear();
            mapSucTimeMsStat.clear();
            mapErrTimeMsStat.clear();
            mapRetcodeStat.clear();
            allTimeMsStat = 0;
            sucTimeMsStat = 0;
            errTimeMsStat = 0;

            allReqNum = 0;
            sucReqNum = 0;
            errReqNum = 0;
        }

    private:
        string get_maptime(int time_ms)
        {
            struct
            {
                int iTime;
                string strTimeKey;
            }arr_times[]={
                {5,"[0,5]"},
                {10,"(5,10]"},
                {50,"(10,50]"},
                {100,"(50,100]"},
                {500,"(100,500]"},
                {1000,"(500,1000]"},
                {-1,"(1000,~)"},
            };
            int count = 5;

            for (int i = 0; i < count; i++)
            {
                if (arr_times[i].iTime == -1)
                {
                    return arr_times[i].strTimeKey;
                }
                if (time_ms <= arr_times[i].iTime)
                {
                    return arr_times[i].strTimeKey;
                }
            }
            return "(1000,~)";//实际上到不了这一步
        }
} StSWNetStat;

//本地统计数据
typedef struct _StSWLocStat
{
    public:
        _StSWLocStat()
        {
            m_stat_info.Init("fl_statfile",stat_desc,STAT_OVER);
            ResetStat();
        }
        void AddCount(int retcode, int time_ms)
        {
            m_stat_info.AddCount(STAT_REQ);
            dealTimeStat(retcode,time_ms);
        }
        void dealTimeStat(int retcode, int time_ms)
        {
            if (retcode == 0)
            {
                m_stat_info.AddCount(STAT_SUC);
                if(time_ms<5)
                    m_stat_info.AddCount(STAT_5_SUC);
                else if(time_ms<10)
                    m_stat_info.AddCount(STAT_10_SUC);
                else if(time_ms<50)
                    m_stat_info.AddCount(STAT_50_SUC);
                else if(time_ms<100)
                    m_stat_info.AddCount(STAT_100_SUC);
                else if(time_ms<200)
                    m_stat_info.AddCount(STAT_200_SUC);
                else if(time_ms<500)
                    m_stat_info.AddCount(STAT_500_SUC);
                else if(time_ms<1000)
                    m_stat_info.AddCount(STAT_1000_SUC);
                else
                    m_stat_info.AddCount(STAT_MORE_SUC);
            }
            else
            {
                m_stat_info.AddCount(STAT_ERR);
                if(time_ms<5)
                    m_stat_info.AddCount(STAT_5_ERR);
                else if(time_ms<10)
                    m_stat_info.AddCount(STAT_10_ERR);
                else if(time_ms<50)
                    m_stat_info.AddCount(STAT_50_ERR);
                else if(time_ms<100)
                    m_stat_info.AddCount(STAT_100_ERR);
                else if(time_ms<200)
                    m_stat_info.AddCount(STAT_200_ERR);
                else if(time_ms<500)
                    m_stat_info.AddCount(STAT_500_ERR);
                else if(time_ms<1000)
                    m_stat_info.AddCount(STAT_1000_ERR);
                else
                    m_stat_info.AddCount(STAT_MORE_ERR);
            }
        }
        void ResetStat()
        {
            m_stat_info.ResetStat();
        }
    private:
        CStatInfo m_stat_info;
} StSWLocStat;

//report生成类
class CSWReport
{
    public:
        CSWReport(StSWNetStat* ptrNetStat)
        {
            m_PtrNetStat = ptrNetStat;
        }
        virtual ~CSWReport()
        {
        }
        string Output()
        {
            Json::FastWriter writer;
            Json::Value root;
            root["allTimeMsStat"] = m_PtrNetStat->allTimeMsStat;
            root["sucTimeMsStat"] = m_PtrNetStat->sucTimeMsStat;
            root["errTimeMsStat"] = m_PtrNetStat->errTimeMsStat;

            root["allReqNum"] = m_PtrNetStat->allReqNum;
            root["sucReqNum"] = m_PtrNetStat->sucReqNum;
            root["errReqNum"] = m_PtrNetStat->errReqNum;

            char tmp[256];
            Json::Value valueAllTimeMap;
            foreach(m_PtrNetStat->mapAllTimeMsStat,it_time)
            {
                valueAllTimeMap[it_time->first] = it_time->second;
            }
            root["alltimemap"] = valueAllTimeMap;

            Json::Value valueSucTimeMap;
            foreach(m_PtrNetStat->mapSucTimeMsStat,it_time)
            {
                valueSucTimeMap[it_time->first] = it_time->second;
            }
            root["suctimemap"] = valueSucTimeMap;

            Json::Value valueErrTimeMap;
            foreach(m_PtrNetStat->mapErrTimeMsStat,it_time)
            {
                valueErrTimeMap[it_time->first] = it_time->second;
            }
            root["errtimemap"] = valueErrTimeMap;

            Json::Value valueRetMap;
            foreach(m_PtrNetStat->mapRetcodeStat,it_ret)
            {
                snprintf(tmp,sizeof(tmp),"%d",it_ret->first);
                valueRetMap[tmp] = it_ret->second;
            }
            root["retmap"] = valueRetMap;

            string output = writer.write(root);

            return output;
        }
    private:
        StSWNetStat *m_PtrNetStat;
};
#endif
