#include <stdlib.h>
#include <time.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <unistd.h>
#include <ctime>
#include <iostream>
#include <map>
#include <memory>
#include <ctime>
#include <cstring>
#include "File.h"
// #include "cppconn/driver.h"
// #include "cppconn/exception.h"
// #include "cppconn/metadata.h"
// #include "cppconn/prepared_statement.h"
// #include "cppconn/statement.h"
// #include "mysql_connection.h"
// #include "mysql_driver.h"
#include "Tool.h"
using namespace std;
// using namespace sql;

typedef long long ll;
// const int N = 5e6 + 5;
const int MM = 20;
const ll INF = 1e18;

float minEdge[MM];
float maxEdge[MM];
float maxx[MM];
float minn[MM]; 

char readfile[200] = "brightkite_Data_1";
int hasAllCnt = 1;
void setParams(int argc, char ** argv) {
    int i;
    if ((i = ArgPos((char *) "-read", argc, argv)) > 0) strcpy(readfile, argv[i + 1]);
    if ((i = ArgPos((char *) "-num", argc, argv)) > 0) hasAllCnt = atoi(argv[i + 1]);
 }
int main(int argc, char ** argv) {
    setParams(argc, argv);
    int dataFileId = ('O' << 0) | ('R' << 8) | ('I' << 16) | ('D' << 24);
    int readFileId;
    RTFileStream stream;
    // RTFileStream outputStream;
    string tt = "./data/" + string(readfile);
    printf("%s\n", tt.c_str());
    if (!stream.OpenRead(tt.c_str())) {
        exit(0);
    }

    // if(!outputStream.OpenWrite("./data/gps_Data2")) { exit(0); }

    int n, m, l;
    n = -1;
    stream.Read(readFileId);
    if(hasAllCnt) stream.Read(n); 
    stream.Read(m); stream.Read(l);
    // int dataFileId = ('O' << 0) | ('R' << 8) | ('I' << 16) | ('D' << 24);
    // outputStream.Write(dataFileId);
    // int hhh = 374639331;
    // outputStream.Write(hhh);
    // outputStream.Write(m);
    // outputStream.Write(l);
    int cnt1 = 0; int cnt2 = 0;
    printf("%d %d %d\n", n, m, l);
    for(int i = 0; i < m + l; ++i) maxx[i] = -INF, minn[i] = INF;
    int cnt = 0;
    for(int i = 0; i < n; ++i) {
        // printf("hhh");
        bool flag = true;
        for(int j = 0; j < m + l; ++j) {
            stream.Read(minEdge[j]);
            maxEdge[j] = minEdge[j];
            minn[j] = min(minn[j], minEdge[j]);
            maxx[j] = max(maxx[j], minEdge[j]);
            // if(j == 0 && minEdge[j] > 90) {
            //     printf("%d yinggyingying\n", i);
            //     flag = false;
            // }
            // if(j == 1 && minEdge[j] > 180) {
            //     printf("%d xingxingxing\n", i);
            //     flag = false;
            // }
        }

        // if(flag) {
        //     cnt ++;
        //     for(int j = 0; j < m + l; ++j) {
        //         outputStream.Write(minEdge[j]);
        //     }
        // }

        // for(int j = 0; j < m + l; ++j) {
        //     printf("%.9f | ", minEdge[j]);
        // }
        // printf("\n");
    }

    for(int j = 0; j < m + l; ++j) {
        printf("%.9f %.9f | ", minn[j], maxx[j]);
    }
    printf("\n");
    // printf("%d\n", cnt);

    return 0;
}