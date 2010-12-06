/*=============================================================================
#  Author:          DanteZhu - http://www.vimer.cn
#  Email:           dantezhu@vip.qq.com
#  FileName:        timecheck.h
#  Version:         1.0
#  LastChange:      2010-12-02 17:13:00
#  Description:     ÿ���೤ʱ����߶��ٴ�ִ��һ�ε�ʱ����
#  History:         
=============================================================================*/
#ifndef _TIMECHECK_H_
#define _TIMECHECK_H_
#include <sys/time.h>
class CTimeCheck
{
    public:
        CTimeCheck()
        {
            Clear();
        }
        /** 
         * @brief   ��ʼ��
         * 
         * @param   maxFreshTime_ms     ���ٺ���ִ��һ��
         * @param   firstTimeShouldRun  ��һ��check��ʱ���Ƿ���뷵��true
         * @param   maxCheckFreq        ÿ���ٸ�������һ��(�������ֵ),0��ÿ�ζ���(Ĭ��Ϊ��)
         * 
         * @return  true                ����ִ��
         *          false               ������ִ��
         */
        int Init(unsigned int maxFreshTime_ms,bool firstTimeShouldRun=false, int maxCheckFreq = 0)
        {
            m_MaxFreshTime_ms = maxFreshTime_ms;
            m_FirstTimeShouldRun = firstTimeShouldRun;
            m_MaxCheckFreq = maxCheckFreq;
            return 0;
        }
        bool Check()
        {
            if(m_MaxFreshTime_ms == 0)
            {
                return true;
            }

            if(!m_Run)
            {
                gettimeofday(&m_Start_TV, NULL);
                m_Run = true;
                if (m_FirstTimeShouldRun)
                {
                    return true;
                }
            }

            if (m_CurCheckTimes >= m_MaxCheckFreq)
            {
                m_CurCheckTimes = 0;
            }
            else
            {
                ++m_CurCheckTimes;
                return false;
            }

            int lefttime  = 0;
            static struct timeval now_tv;
            gettimeofday(&now_tv, NULL);
            lefttime =  (now_tv.tv_sec  - m_Start_TV.tv_sec ) * 1000 + (now_tv.tv_usec - m_Start_TV.tv_usec) / 1000;
            if (lefttime < 0)
            {
                lefttime = 0;
            }
            if( (unsigned)lefttime >= m_MaxFreshTime_ms)
            {
                gettimeofday(&m_Start_TV, NULL);
                return true;
            }
            return false;
        }

        bool Stat()
        {
            return m_Run;
        }

        void Clear()
        {
            m_MaxFreshTime_ms = 0;//΢��,û������
            m_MaxCheckFreq = 0;//ÿ�ζ����
            m_CurCheckTimes = 0;
            m_Run = false;
        }
    private:
        unsigned int m_MaxFreshTime_ms;
        int m_MaxCheckFreq;

        int m_CurCheckTimes;//��ǰδ���Ĵ���

        struct timeval m_Start_TV;

        bool m_Run;

        bool m_FirstTimeShouldRun;
};
#endif
