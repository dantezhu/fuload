/*=============================================================================
#  Author:          dantezhu - http://www.vimer.cn
#  Email:           zny2008@gmail.com
#  FileName:        speedlimit.h
#  Description:     �ٶ�������
#  Version:         1.0
#  LastChange:      2010-12-05 11:51:13
#  History:         
=============================================================================*/
#ifndef _SPEEDLIMIT_H_
#define _SPEEDLIMIT_H_
#include <sys/time.h>
class CSpeedLimit
{
    public:
        CSpeedLimit()
        {/*{{{*/
            Clear();
        }/*}}}*/

        /** 
         * @brief   ��ʼ��
         * 
         * @param   iMaxCount   ����ٶ�
         * 
         */
        void Init(int iMaxCount)
        {/*{{{*/
            m_MaxCount=iMaxCount;
            m_TrueMaxCount=iMaxCount;
        }/*}}}*/

        /** 
         * @brief   �����ٶ�
         * 
         * @return  0,1,2,3
         */
        int DetectAndLimit()
        {/*{{{*/
            if(!m_Run)
            {
                m_Run=true;
                gettimeofday(&m_tpstart,NULL);
            }
            if (m_MaxCount<=0)
            {
                return 1;
            }
            ++m_CountPerSec;
            //printf("trueMax[%d]\n",m_TrueMaxCount);
            if(m_CountPerSec<m_TrueMaxCount)
            {
                //printf("%d\n",m_CountPerSec);
                return 0;
            }
            int ret=0;
            gettimeofday(&m_tpend,NULL);
            int timeuse=1000000*(m_tpend.tv_sec-m_tpstart.tv_sec)+m_tpend.tv_usec-m_tpstart.tv_usec;//΢��
            if(timeuse<=1000000 )
            {
                if(m_CountPerSec>=m_MaxCount)
                {
                    m_Speed=m_CountPerSec;
                    //��̬����
                    m_TrueMaxCount=m_Speed;

                    usleep(1000000-timeuse);
                    gettimeofday(&m_tpstart,NULL);
                    m_CountPerSec=0;
                    ret = 1;
                }
                ret = 2;
            }
            else
            {
                m_Speed = m_CountPerSec*1000000/timeuse;
                //��̬����
                m_TrueMaxCount=m_Speed;

                gettimeofday(&m_tpstart,NULL);
                m_CountPerSec=0;
                ret = 3;
            }
            return ret;
        }/*}}}*/

        /** 
         * @brief   ��ȡ��ǰ�ٶ�
         * 
         * @return  �ٶ�
         */
        int Speed()
        {/*{{{*/
            return m_Speed;
        }/*}}}*/

        /** 
         * @brief   �����������
         */
        void Clear()
        {/*{{{*/
            m_MaxCount=0;
            m_TrueMaxCount=0;
            m_CountPerSec=0;
            m_Speed=0;
            m_Run=false;
        }/*}}}*/

    private:
        struct timeval m_tpstart,m_tpend;
        //���õ�����ٶ�
        int m_MaxCount;

        //ͨ����̬�����õ�����ʵ��������ٶ�
        int m_TrueMaxCount;

        //������
        int m_CountPerSec;

        //��ǰ�ٶ�
        int m_Speed;

        bool m_Run;
};
#endif

/*#include <iostream>
#include "speedlimit.h"
using namespace std;
int main()
{
    CSpeedLimit speedlimit;
    speedlimit.Init(10);
    while(1)
    {
        speedlimit.DetectAndLimit();
        printf("%d\n",speedlimit.Speed());
    }
} */
