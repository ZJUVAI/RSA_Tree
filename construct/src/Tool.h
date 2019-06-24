#ifndef TOOL_H
#define TOOL_H

#include <cstdio>
#include <iostream>
using namespace std;

int Pow(int x, int y) {
    int ans = 1;
    while(y) {
        if(y & 1) ans = ans * x;
        y >>= 1;
        x = x * x;
    }
    return ans;
}

int CaculateWeekDay(int y, int m, int d)
{
    if(m==1||m==2) //把一月和二月换算成上一年的十三月和是四月
    {
        m+=12;
        y--;
    }
    int Week=(d+2*m+3*(m+1)/5+y+y/4-y/100+y/400)%7;
    return Week;
}

int ArgPos(char *str, int argc, char **argv) {
    int a;
    for (a = 1; a < argc; a++) if (!strcmp(str, argv[a])) {
        if (a == argc - 1) {
            printf("Argument missing for %s\n", str);
            exit(1);
        }
        return a;
    }
    return -1;
}

int CalculateDays(int y, int m, int d) { /* Rata Die day one is 0001-01-01 */
    if (m < 3)
        y--, m += 12;
    return 365*y + y/4 - y/100 + y/400 + (153*m - 457)/5 + d - 306;
}


#endif


