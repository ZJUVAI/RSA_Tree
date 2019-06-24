#ifndef RTREE_H
#define RTREE_H

// NOTE This file compiles under MSVC 6 SP5 and MSVC .Net 2003 it may not work on other compilers without modification.

// NOTE These next few lines may be win32 specific, you may need to modify them to compile on other platform
#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <algorithm>
#include <functional>
#include <pthread.h>
#include "SAT.h"
#include "File.h"
#include "Lsh.h"
#include "Tool.h"

#ifndef SmallPool
const long long SATSIZE = 6059853300;
#else
const long long SATSIZE = 505985330;
#endif

const int SATNODES = 200000;
const int DATASIZE = 5e6 + 5;
// #define // ASSERT // ASSERT  // RTree uses // ASSERT( condition )
#ifndef Min
#define Min std::min
#endif  // Min
#ifndef Max
#define Max std::max
#endif  // Max
//
// RTree.h
//

#define RTREE_TEMPLATE template <int INNDIMS, class INNTYPE, int NUMDIMS, class ELEMTYPE, class ELEMTYPEREAL, int TMAXNODES, int TMINNODES, int LEAFMAX, int LEAFMIN, class DATATYPE>
#define RTREE_QUAL RTree<INNDIMS, INNTYPE, NUMDIMS, ELEMTYPE, ELEMTYPEREAL, TMAXNODES, TMINNODES, LEAFMAX, LEAFMIN, DATATYPE>

#define RTREE_DONT_USE_MEMPOOLS     // This version does not contain a fixed memory allocator, fill in lines with EXAMPLE to implement one.
#define RTREE_USE_SPHERICAL_VOLUME  // Better split classification, may be slower on some systems

// Fwd decl

// struct BASASUYA_Rect {
//     float* m_min;  ///< Min dimensions of bounding box
//     float* m_max;  ///< Max dimensions of bounding box
//     BASASUYA_Rect() {}
//     BASASUYA_Rect(int NUMDIMS) {
//         m_min = new float(NUMDIMS);
//         m_max = new float(NUMDIMS);
//     }
// };

class RTFileStream;  // File I/O helper class, look below for implementation and notes.

/// \class RTree
/// Implementation of RTree, a multidimensional bounding rectangle tree.
/// Example usage: For a 3-dimensional tree use RTree<Object*, float, 3> myTree;
///
/// This modified, templated C++ version by Greg Douglas at Auran (http://www.auran.com)
///
/// DATATYPE Referenced data, should be int, void*, obj* etc. no larger than sizeof<void*> and simple type
/// ELEMTYPE Type of element such as int or float
/// NUMDIMS Number of dimensions such as 2 or 3
/// ELEMTYPEREAL Type of element that allows fractional and large values such as float or double, for use in volume calcs
///
/// NOTES: Inserting and removing data requires the knowledge of its constant Minimal Bounding Rectangle.
///        This version uses new/delete for nodes, I recommend using a fixed size allocator for efficiency.
///        Instead of using a callback function for returned results, I recommend and efficient pre-sized, grow-only memory
///        array similar to MFC CArray or STL Vector for returning search query result.
///

struct rtreeStruct {
    bool _useLayer;
    int _layerMul;
    rtreeStruct() {
        _useLayer = false;
        _layerMul = 1;
    }
};

template <int INNDIMS, class INNTYPE, int NUMDIMS, class ELEMTYPE, class ELEMTYPEREAL, int TMAXNODES, int TMINNODES, int LEAFMAX, int LEAFMIN, class DATATYPE>
class RTree {
   protected:
    //have't written into json
    const bool savePart = true;
    int useForSplit = 2;

    bool useDifference;
    bool useHash;
    bool useLayer;
    int layerMul;
    vector<int> layerDfs;
    int insertTime;
    // int cntNodes = 0;
    int satTot;
    long long satOffset;
    int numdimLimit[NUMDIMS];
    int query[INNDIMS];
    static INNTYPE SATPOOL[SATSIZE];
    static INNTYPE Data[DATASIZE][INNDIMS];
    static SAT<ELEMTYPE, INNTYPE, INNDIMS, NUMDIMS> sat[SATNODES];
    // SAT<ELEMTYPE, ELEMTYPEREAL, INNDIMS, NUMDIMS> sat[SATNODES];
    // LSH<NUMDIMS, SATNODES, HASHNUM, HASHSIZE> lsh;
    struct Node;  // Fwd decl.  Used by other internal structs and iterator

   public:
    // These constant must be declared after Branch and before Node struct
    // Stuck up here for MSVC 6 compiler.  NSVC .NET 2003 is much happier.
    // enum {
    //     TMAXNODES = TMAXNODES,  ///< Max elements in node
    //     TMINNODES = TMINNODES,  ///< Min elements in node
    // };

   public:
    RTree();
    RTree(satStruct& A);
    void copy(satStruct& A);
    RTree(const RTree& other);
    virtual ~RTree();

    /// Insert entry
    /// \param a_min Min of bounding rect
    /// \param a_max Max of bounding rect
    /// \param a_dataId Positive Id of data.  Maybe zero, but negative numbers not allowed.
    void Insert(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], const DATATYPE& a_dataId, INNTYPE* insertData);

    // Insert But don't modify the struct of the Tree
    void InsertNotModify(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], INNTYPE* insertData);

    void InsertChangeRect(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], INNTYPE* insertData);

    void Debug();
    /// Remove entry
    /// \param a_min Min of bounding rect
    /// \param a_max Max of bounding rect
    /// \param a_dataId Positive Id of data.  Maybe zero, but negative numbers not allowed.
    void Remove(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], const DATATYPE& a_dataId);

    /// Find all within search rectangle
    /// \param a_min Min of search bounding rect
    /// \param a_max Max of search bounding rect
    /// \param a_searchResult Search result array.  Caller should set grow size. Function will reset, not append to array.
    /// \param a_resultCallback Callback function to return result.  Callback should return 'true' to continue searching
    /// \param a_context User context to pass as parameter to a_resultCallback
    /// \return Returns the number of entries found
    int Search(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], std::function<bool(const DATATYPE&)> callback) const;

    void initSAT(satStruct& parameters);
    // void initLSH(lshStruct& parameters);
    void generate();

    int* allAsk(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS]);
    
    int* Ask(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS]);

    // float* lshAsk(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS]);
    /// Remove all entries from tree
    void RemoveAll();

    // BASASUYA_Rect Domain();
    /// Count the data elements in this container.  This is slow as no internal counter is maintained.
    int Count();

    /// Load tree contents from file
    bool Load(const char* a_fileName);
    bool LoadRTree(const char* a_fileName, satStruct& satSet);
    bool LoadSAT(const char* a_fileName, satStruct& satSet);
    /// Load tree contents from stream
    bool Load(RTFileStream& a_stream);
    bool LoadRTree(RTFileStream& a_stream, satStruct& satSet);
    bool LoadSAT(RTFileStream& a_stream, satStruct& satSet);

    /// Save tree contents to file
    bool Save(const char* a_fileName);
    /// Save tree contents to stream
    bool Save(RTFileStream& a_stream);

    bool SaveAll(const char* a_fileName);
    bool SaveParameter(const char* a_fileName, satStruct& parameter);
    bool SaveRTree(const char* a_fileName);
    bool SaveSAT(const char* a_fileName);


    bool SaveAll(RTFileStream& a_stream);
    bool SaveParameter(RTFileStream& a_stream, satStruct& parameter);
    bool SaveRTree(RTFileStream& a_stream);
    bool SaveSAT(RTFileStream& a_stream);
    /// Iterator is not remove safe.
    struct arg_struct{
        void *ptr;
        int id;
        int times;
        arg_struct(void *x, int y, int z) :ptr(x), id(y), times(z){};
        arg_struct(void *x, int y) :ptr(x), id(y){};
    };
    class Iterator {
       private:
        enum { MAX_STACK = 32 };  //  Max stack size. Allows almost n^32 where n is number of branches in node

        struct StackElement {
            Node* m_node;
            int m_branchIndex;
        };

       public:
        Iterator() { Init(); }

        ~Iterator() {}

        /// Is iterator invalid
        bool IsNull() { return (m_tos <= 0); }

        /// Is iterator pointing to valid data
        bool IsNotNull() { return (m_tos > 0); }

        /// Access the current data element. Caller must be sure iterator is not NULL first.
        DATATYPE& operator*() {
            // // ASSERT(IsNotNull());
            StackElement& curTos = m_stack[m_tos - 1];
            return curTos.m_node->m_branch[curTos.m_branchIndex].m_data;
        }

        /// Access the current data element. Caller must be sure iterator is not NULL first.
        const DATATYPE& operator*() const {
            // // ASSERT(IsNotNull());
            StackElement& curTos = m_stack[m_tos - 1];
            return curTos.m_node->m_branch[curTos.m_branchIndex].m_data;
        }

        /// Find the next data element
        bool operator++() { return FindNextData(); }

        /// Get the bounds for this node
        void GetBounds(ELEMTYPE a_min[NUMDIMS], ELEMTYPE a_max[NUMDIMS]) {
            // // ASSERT(IsNotNull());
            StackElement& curTos = m_stack[m_tos - 1];
            Branch& curBranch = curTos.m_node->m_branch[curTos.m_branchIndex];

            for (int index = 0; index < NUMDIMS; ++index) {
                a_min[index] = curBranch.m_rect.m_min[index];
                a_max[index] = curBranch.m_rect.m_max[index];
            }
        }

       private:
        /// Reset iterator
        void Init() { m_tos = 0; }

        /// Find the next data element in the tree (For internal use only)
        bool FindNextData() {
            for (;;) {
                if (m_tos <= 0) {
                    return false;
                }
                StackElement curTos = Pop();  // Copy stack top cause it may change as we use it

                if (curTos.m_node->IsLeaf()) {
                    // Keep walking through data while we can
                    if (curTos.m_branchIndex + 1 < curTos.m_node->m_count) {
                        // There is more data, just point to the next one
                        Push(curTos.m_node, curTos.m_branchIndex + 1);
                        return true;
                    }
                    // No more data, so it will fall back to previous level
                } else {
                    if (curTos.m_branchIndex + 1 < curTos.m_node->m_count) {
                        // Push sibling on for future tree walk
                        // This is the 'fall back' node when we finish with the current level
                        Push(curTos.m_node, curTos.m_branchIndex + 1);
                    }
                    // Since cur node is not a leaf, push first of next level to get deeper into the tree
                    Node* nextLevelnode = curTos.m_node->m_branch[curTos.m_branchIndex].m_child;
                    Push(nextLevelnode, 0);

                    // If we pushed on a new leaf, exit as the data is ready at TOS
                    if (nextLevelnode->IsLeaf()) {
                        return true;
                    }
                }
            }
        }

        /// Push node and branch onto iteration stack (For internal use only)
        void Push(Node* a_node, int a_branchIndex) {
            m_stack[m_tos].m_node = a_node;
            m_stack[m_tos].m_branchIndex = a_branchIndex;
            ++m_tos;
            // // ASSERT(m_tos <= MAX_STACK);
        }

        /// Pop element off iteration stack (For internal use only)
        StackElement& Pop() {
            // // ASSERT(m_tos > 0);
            --m_tos;
            return m_stack[m_tos];
        }

        StackElement m_stack[MAX_STACK];  ///< Stack as we are doing iteration instead of recursion
        int m_tos;                        ///< Top Of Stack index

        friend class RTree;  // Allow hiding of non-public functions while allowing manipulation by logical owner
    };

    /// Get 'first' for iteration
    void GetFirst(Iterator& a_it) {
        a_it.Init();
        Node* first = m_root;
        while (first) {
            if (first->IsInternalNode() && first->m_count > 1) {
                a_it.Push(first, 1);  // Descend sibling branch later
            } else if (first->IsLeaf()) {
                if (first->m_count) {
                    a_it.Push(first, 0);
                }
                break;
            }
            first = first->m_branch[0].m_child;
        }
    }

    /// Get Next for iteration
    void GetNext(Iterator& a_it) { ++a_it; }

    /// Is iterator NULL, or at end?
    bool IsNull(Iterator& a_it) { return a_it.IsNull(); }

    /// Get object at iterator position
    DATATYPE& GetAt(Iterator& a_it) { return *a_it; }

   protected:
    /// Minimal bounding rectangle (n-dimensional)
    struct Rect {
        ELEMTYPE m_min[NUMDIMS];  ///< Min dimensions of bounding box
        ELEMTYPE m_max[NUMDIMS];  ///< Max dimensions of bounding box
    };

    /// May be data or may be another subtree
    /// The parents level determines this.
    /// If the parents level is 0, then this is data
    struct Branch {
        int sortId;
        Rect m_rect;      ///< Bounds
        Node* m_child;    ///< Child node
        DATATYPE m_data;  ///< Data Id
        ~Branch() {
            // printf("I am dead!\n");
        }
    };

    /// Node for each branch level
    struct Node {
        bool IsInternalNode() { return (m_level > 0); }  // Not a leaf, but a internal node
        bool IsLeaf() { return (m_level == 0); }         // A leaf, contains data

        int satId;
        int m_count;                ///< Count
        int m_level;                ///< Leaf is zero, others positive
        // vector<Branch> m_branch;
        Branch m_branch[LEAFMAX];  ///< Branch
        Node() {
            // m_branch.clear();
        }
        ~Node() {
            // printf("I am dead!\n");
            // vector<Branch>().swap(m_branch);
        }
    };

    /// A link list of nodes for reinsertion after a delete operation
    struct ListNode {
        ListNode* m_next;  ///< Next in list
        Node* m_node;      ///< Node
    };

    /// Variables for finding a split partition
    struct PartitionVars {
        enum { NOT_TAKEN = -1 };  // indicates that position

        // int* m_partition;
        int m_partition[LEAFMAX + 1];
        int m_total;
        int m_minFill;
        int m_count[2];
        Rect m_cover[2];
        ELEMTYPEREAL m_area[2];

        // Branch* m_branchBuf;
        Branch m_branchBuf[LEAFMAX + 1];
        int m_branchCount;
        Rect m_coverSplit;
        ELEMTYPEREAL m_coverSplitArea;   
        ~PartitionVars() {
            // printf("I am dead!\n");
            // delete[] m_partition;
            // delete[] m_branchBuf;
        }
    };


    Rect CombineGroupRect(PartitionVars* a_parVars, int fr, int to) {
        Rect ttt;
        for(int j = fr; j < to; ++j) {
            if(j == fr) ttt = a_parVars->m_branchBuf[j].m_rect;
            else ttt = CombineRect(&ttt, &a_parVars->m_branchBuf[j].m_rect);
        }
        return ttt;
    }  
    Node* AllocNode();
    void FreeNode(Node* a_node);
    void InitNode(Node* a_node);
    void InitRect(Rect* a_rect);
    bool InsertRectRec(const Branch& a_branch, Node* a_node, Node** a_newNode, int a_level);
    bool InsertRect(const Branch& a_branch, Node** a_root, int a_level);
    void generate_thread_caller(void *arg);
    void generateSolve(int id);
    bool InsertRectNotModify(Node* a_root, int a_level, const ELEMTYPE* a_min, INNTYPE* insertData);
    void InsertRectChangeRect(Node* a_root, int a_level, const ELEMTYPE* a_min, INNTYPE* insertData);
    Rect NodeCover(Node* a_node);
    bool AddBranch(const Branch* a_branch, Node* a_node, Node** a_newNode);
    void DisconnectBranch(Node* a_node, int a_index);
    int PickBranch(const Rect* a_rect, Node* a_node);
    int PickBranchDiffusion(const Rect* a_rect, Node* a_node);
    int PickBranch(const ELEMTYPE* a_rect, Node* a_node);
    Rect CombineRect(const Rect* a_rectA, const Rect* a_rectB);
    Rect InteractionRect(const Rect* a_rectA, const Rect* a_rectB);
    Rect CombineRect(const Rect* a_rectA, const ELEMTYPE* insertData);
    void debugDfs(Node* a_node);
    void SplitNode(Node* a_node, const Branch* a_branch, Node** a_newNode, int MAXNODES, int MINNODES);
    ELEMTYPEREAL RectSphericalVolume(Rect* a_rect);
    ELEMTYPEREAL RectVolume(Rect* a_rect);
    ELEMTYPEREAL CalcRectVolume(Rect* a_rect);
    ELEMTYPEREAL CalcRectMargin(Rect* a_rect);
    void GetBranches(Node* a_node, const Branch* a_branch, PartitionVars* a_parVars, int MAXNODES, int MINNODES);
    void ChoosePartition(PartitionVars* a_parVars, int a_minFill);
    void ChooseAxisPartition(PartitionVars* a_parVars, int MAXNODES, int MINNODES);
    void LoadNodes(Node* a_nodeA, Node* a_nodeB, PartitionVars* a_parVars);
    void InitParVars(PartitionVars* a_parVars, int a_maxRects, int a_minFill);
    void PickSeeds(PartitionVars* a_parVars);
    void Classify(int a_index, int a_group, PartitionVars* a_parVars);
    bool RemoveRect(Rect* a_rect, const DATATYPE& a_id, Node** a_root);
    bool RemoveRectRec(Rect* a_rect, const DATATYPE& a_id, Node* a_node, ListNode** a_listNode);
    ListNode* AllocListNode();
    void FreeListNode(ListNode* a_listNode);
    bool Overlap(Rect* a_rectA, Rect* a_rectB) const;
    bool Overlap(const ELEMTYPE* a_rectA, Rect* a_rectB) const;
    void ReInsert(Node* a_node, ListNode** a_listNode);
    bool Search(Node* a_node, Rect* a_rect, int& a_foundCount, std::function<bool(const DATATYPE&)> callback) const;
    void askDfs(Node* a_node, Rect* a_rect);
    void generateLayerDfs(Node* a_node, satStruct& parameters);
    void generateDfs(Node* a_node, satStruct& parameters);
    void RemoveAllRec(Node* a_node);
    void Reset();
    void CountRec(Node* a_node, int& a_count);

    bool SaveRec(Node* a_node, RTFileStream& a_stream);
    bool SaveRecAll(Node* a_node, RTFileStream& a_stream);
    bool LoadRec(Node* a_node, RTFileStream& a_stream);
    bool LoadRecAll(Node* a_node, Branch* preNode, RTFileStream& a_stream);
    void CopyRec(Node* current, Node* other);

    int AllofNode;
    Node* m_root;                     ///< Root of tree
    ELEMTYPEREAL m_unitSphereVolume;  ///< Unit sphere constant for required number of dimensions
    Rect rootInformation;
};

// Because there is not stream support, this is a quick and dirty file I/O helper.
// Users will likely replace its usage with a Stream implementation from their favorite API.


RTREE_TEMPLATE
RTREE_QUAL::RTree() { /**Attention the init Rtree without rtreeStruct we don't modify**/
    // // ASSERT(TMAXNODES > TMINNODES);
    // // ASSERT(TMINNODES > 0);

    // // Precomputed volumes of the unit spheres for the first few dimensions
    // const float UNIT_SPHERE_VOLUMES[] = {
    //     0.000000f, 2.000000f, 3.141593f,  // Dimension  0,1,2
    //     4.188790f, 4.934802f, 5.263789f,  // Dimension  3,4,5
    //     5.167713f, 4.724766f, 4.058712f,  // Dimension  6,7,8
    //     3.298509f, 2.550164f, 1.884104f,  // Dimension  9,10,11
    //     1.335263f, 0.910629f, 0.599265f,  // Dimension  12,13,14
    //     0.381443f, 0.235331f, 0.140981f,  // Dimension  15,16,17
    //     0.082146f, 0.046622f, 0.025807f,  // Dimension  18,19,20
    // };
    // AllofNode = 0;
    // insertTime = 0;
    // satOffset = 0;
    // m_root = AllocNode();
    // m_root->m_level = 0;
    // m_unitSphereVolume = (ELEMTYPEREAL) UNIT_SPHERE_VOLUMES[NUMDIMS];
}

RTREE_TEMPLATE
RTREE_QUAL::RTree(satStruct& A) { /**Attention the init Rtree without rtreeStruct we don't modify**/
    // // ASSERT(TMAXNODES > TMINNODES);
    // // ASSERT(TMINNODES > 0);

    // Precomputed volumes of the unit spheres for the first few dimensions
    // const float UNIT_SPHERE_VOLUMES[] = {
    //     0.000000f, 2.000000f, 3.141593f,  // Dimension  0,1,2
    //     4.188790f, 4.934802f, 5.263789f,  // Dimension  3,4,5
    //     5.167713f, 4.724766f, 4.058712f,  // Dimension  6,7,8
    //     3.298509f, 2.550164f, 1.884104f,  // Dimension  9,10,11
    //     1.335263f, 0.910629f, 0.599265f,  // Dimension  12,13,14
    //     0.381443f, 0.235331f, 0.140981f,  // Dimension  15,16,17
    //     0.082146f, 0.046622f, 0.025807f,  // Dimension  18,19,20
    // };
    // // sat.reserve(SATNODES);
    // AllofNode = 0;
    // useForSplit = A._useForSplit;
    // insertTime = 0;
    // satTot = 0;
    // satOffset = 0;
    // m_root = AllocNode();
    // m_root->m_level = 0;
    // useLayer = A._useLayer;
    // layerMul = A._layerMul;
    // useHash = A._useHash;
    // useDifference = A._useDiffernce;
    // layerDfs.clear();
    // m_unitSphereVolume = (ELEMTYPEREAL) UNIT_SPHERE_VOLUMES[NUMDIMS];
    


}

RTREE_TEMPLATE
void RTREE_QUAL::copy(satStruct& A) {
    // // ASSERT(TMAXNODES > TMINNODES);
    // // ASSERT(TMINNODES > 0);

    // Precomputed volumes of the unit spheres for the first few dimensions
    const float UNIT_SPHERE_VOLUMES[] = {
        0.000000f, 2.000000f, 3.141593f,  // Dimension  0,1,2
        4.188790f, 4.934802f, 5.263789f,  // Dimension  3,4,5
        5.167713f, 4.724766f, 4.058712f,  // Dimension  6,7,8
        3.298509f, 2.550164f, 1.884104f,  // Dimension  9,10,11
        1.335263f, 0.910629f, 0.599265f,  // Dimension  12,13,14
        0.381443f, 0.235331f, 0.140981f,  // Dimension  15,16,17
        0.082146f, 0.046622f, 0.025807f,  // Dimension  18,19,20
    };
    // sat.reserve(SATNODES);
    AllofNode = 0;
    useForSplit = A._useForSplit;
    insertTime = 0;
    satTot = 0;
    satOffset = 0;
    m_root = AllocNode();
    m_root->m_level = 0;

    useLayer = A._useLayer;
    layerMul = A._layerMul;
    useHash = A._useHash;
    useDifference = A._useDiffernce;
    
    layerDfs.clear();
    m_unitSphereVolume = (ELEMTYPEREAL) UNIT_SPHERE_VOLUMES[NUMDIMS];


    // useLayer = true;
    // layerMul = 2;
}

RTREE_TEMPLATE
RTREE_QUAL::RTree(const RTree& other) : RTree() { CopyRec(m_root, other.m_root); }

RTREE_TEMPLATE
RTREE_QUAL::~RTree() {
    Reset();  // Free, or reset node memory
}

RTREE_TEMPLATE
void RTREE_QUAL::Insert(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], const DATATYPE& a_dataId, INNTYPE* insertData) {
#ifdef _DEBUG
    for (int index = 0; index < NUMDIMS; ++index) {
        // ASSERT(a_min[index] <= a_max[index]);
    }
#endif  //_DEBUG
    Branch branch;
    branch.m_data = a_dataId;
    branch.m_child = NULL;
    for (int i = 0; i < INNDIMS; ++i) {
        Data[a_dataId][i] = insertData[i];
    }

    for (int axis = 0; axis < NUMDIMS; ++axis) {
        branch.m_rect.m_min[axis] = a_min[axis];
        branch.m_rect.m_max[axis] = a_max[axis];
    }

    InsertRect(branch, &m_root, 0);
}

RTREE_TEMPLATE
void RTREE_QUAL::InsertChangeRect(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], INNTYPE* insertData) {
     InsertRectChangeRect(m_root, 0, a_min, insertData);
}

RTREE_TEMPLATE
void RTREE_QUAL::InsertNotModify(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], INNTYPE* insertData) {
    bool ok = InsertRectNotModify(m_root, 0, a_min, insertData);
    // if(ok == false) {
    //     // ASSERT(0);
    // }
}

RTREE_TEMPLATE
void RTREE_QUAL::Remove(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], const DATATYPE& a_dataId) {
#ifdef _DEBUG
    for (int index = 0; index < NUMDIMS; ++index) {
        // ASSERT(a_min[index] <= a_max[index]);
    }
#endif  //_DEBUG

    Rect rect;

    for (int axis = 0; axis < NUMDIMS; ++axis) {
        rect.m_min[axis] = a_min[axis];
        rect.m_max[axis] = a_max[axis];
    }

    RemoveRect(&rect, a_dataId, &m_root);
}
RTREE_TEMPLATE
void RTREE_QUAL::initSAT(satStruct& parameters) {
    rootInformation = NodeCover(m_root);
    printf("tree level = %d\n", m_root->m_level + 1);
    satTot = 0;
    // for(int i = 0; i < NUMDIMS; ++i) {
    //     numdimLimit[i] = parameters._cooLimitLength[i];
    // }
    parameters._domain_min = rootInformation.m_min;
    parameters._domain_max = rootInformation.m_max;
    parameters._totalInsert = insertTime;
    // parameters._satNum = 
    // printf("useLayer %d\n", useLayer);
    useLayer ? generateLayerDfs(m_root, parameters) : generateDfs(m_root, parameters);
    printf("satTot: %d\n", satTot);
}
// RTREE_TEMPLATE
// void RTREE_QUAL::initLSH(lshStruct& parameters) {
//     Rect tt = NodeCover(m_root);
//     parameters._domain_min = tt.m_min;
//     parameters._domain_max = tt.m_max;
//     parameters._itemNum = satTot;
//     lsh.copy(parameters);
// }


RTREE_TEMPLATE
void RTREE_QUAL::generate() {
    printf("tree level = %d\n", m_root->m_level + 1);
    printf("satTot: %d\n", satTot);
    printf("satOffset: %lld\n", satOffset);
// #pragma omp parallel for  
    for (int i = 0; i < satTot; ++i) {
        // printf("%d\n", i);
        sat[i].generateSat();
        // lsh.update(sat[i].domain_min, sat[i].domain_max, i);
    }

    // int n_threads = 8;
    // pthread_t *pt = new pthread_t[n_threads];
    // for (int j = 0; j < n_threads; ++j) pthread_create(&pt[j], NULL, RTree<INNDIMS, INNTYPE, NUMDIMS, ELEMTYPE, ELEMTYPEREAL, TMAXNODES, TMINNODES, LEAFMAX, LEAFMIN, DATATYPE>::generate_thread_caller, new arg_struct(this, j));
    // for (int j = 0; j < n_threads; ++j) pthread_join(pt[j], NULL);
    // delete[] pt;
}

// RTREE_TEMPLATE
// void RTREE_QUAL::generate_thread_caller(void *arg)
// {
//     RTREE_QUAL *ptr = (RTREE_QUAL*)(((arg_struct*)arg)->ptr);
//     ptr->generateSolve(((arg_struct*)arg)->id);
//     pthread_exit(NULL);
// }



// RTREE_TEMPLATE
// void RTREE_QUAL::generateSolve(int id) {
//     int l = satTot / 8 * id; int r = satTot / 8 * (id+1);
//     if(id == 7) r = satTot;
//     for(int i = l; i < r; ++i) {
//         sat[i].generateSat();
//     }
// }

RTREE_TEMPLATE
void RTREE_QUAL::Debug() {
    printf("tree level: %d\n", m_root->m_level);
    printf("satOffset: %lld\n", satOffset);
    // printf("%d\n", insertTime);
    debugDfs(m_root);
    // printf("%d\n", cntNodes);
}

RTREE_TEMPLATE int RTREE_QUAL::Search(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS], std::function<bool(const DATATYPE&)> callback) const {
#ifdef _DEBUG
    for (int index = 0; index < NUMDIMS; ++index) {
        // ASSERT(a_min[index] <= a_max[index]);
    }
#endif  //_DEBUG

    Rect rect;

    for (int axis = 0; axis < NUMDIMS; ++axis) {
        rect.m_min[axis] = a_min[axis];
        rect.m_max[axis] = a_max[axis];
    }

    // NOTE: May want to return search result another way, perhaps returning the number of found elements here.

    int foundCount = 0;
    Search(m_root, &rect, foundCount, callback);

    return foundCount;
}

RTREE_TEMPLATE
int* RTREE_QUAL::Ask(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS]) {
    Rect a_rect;

    for (int axis = 0; axis < NUMDIMS; ++axis) {
        a_rect.m_min[axis] = a_min[axis];
        a_rect.m_max[axis] = a_max[axis];
    }

    for(int i = 0; i < INNDIMS; ++i) query[i] = 0;
    askDfs(m_root, &a_rect);
    return query;
}

RTREE_TEMPLATE
int* RTREE_QUAL::allAsk(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS]) {
    Rect a_rect;

    for (int axis = 0; axis < NUMDIMS; ++axis) {
        a_rect.m_min[axis] = a_min[axis];
        a_rect.m_max[axis] = a_max[axis];
    }

    for(int i = 0; i < INNDIMS; ++i) query[i] = 0;
    for(int i = 0; i < satTot; ++i) {
        sat[i].calulate(a_rect.m_min, a_rect.m_max, query);
    }
    return query;
}

// RTREE_TEMPLATE
// float* RTREE_QUAL::lshAsk(const ELEMTYPE a_min[NUMDIMS], const ELEMTYPE a_max[NUMDIMS]) {
//     Rect a_rect;

//     for (int axis = 0; axis < NUMDIMS; ++axis) {
//         a_rect.m_min[axis] = a_min[axis];
//         a_rect.m_max[axis] = a_max[axis];
//     }

//     float* ans = new float(INNDIMS);
//     for(int i = 0; i < INNDIMS; ++i) {
//         ans[i] = 0;
//     }
//     int *tmp = lsh.testRange(a_rect.m_min, a_rect.m_max);
//     for(int i = 0; i < satTot; ++i) {
//         if(tmp[i] == NUMDIMS - 1) {
//             // printf("hhh %dhh\n", i);
//             float* tt = sat[i].calulate(a_rect.m_min, a_rect.m_max);
//             for (int j = 0; j < INNDIMS; ++j) {
//                 ans[j] += tt[j];
//                 // ASSERT(tt[j] >= 0);
//             }
//             delete tt;
//         }
//     }
//     return ans;
// }

// RTREE_TEMPLATE
// BASASUYA_Rect RTREE_QUAL::Domain() {
//     Rect t1 = NodeCover(m_root);
//     BASASUYA_Rect tt = BASASUYA_Rect(NUMDIMS);
//     for (int i = 0; i < NUMDIMS; ++i) {
//         tt.m_min[i] = t1.m_min[i];
//         tt.m_max[i] = t1.m_max[i];
//     }
//     return tt;
// }

RTREE_TEMPLATE int RTREE_QUAL::Count() {
    int count = 0;
    CountRec(m_root, count);

    return count;
}

RTREE_TEMPLATE
void RTREE_QUAL::CountRec(Node* a_node, int& a_count) {
    if (a_node->IsInternalNode())  // not a leaf node
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            CountRec(a_node->m_branch[index].m_child, a_count);
        }
    } else  // A leaf node
    {
        a_count += a_node->m_count;
    }
}

RTREE_TEMPLATE
bool RTREE_QUAL::Load(const char* a_fileName) {
    RemoveAll();  // Clear existing tree

    RTFileStream stream;
    if (!stream.OpenRead(a_fileName)) {
        return false;
    }

    bool result = Load(stream);

    stream.Close();

    return result;
}


RTREE_TEMPLATE
bool RTREE_QUAL::Load(RTFileStream& a_stream) {
    // Write some kind of header
    int _dataFileId = ('R' << 0) | ('T' << 8) | ('R' << 16) | ('E' << 24);
    int _dataSize = sizeof(DATATYPE);
    int _dataNumDims = NUMDIMS;
    int _dataElemSize = sizeof(ELEMTYPE);
    int _dataElemRealSize = sizeof(ELEMTYPEREAL);
    int _dataMaxNodes = TMAXNODES;
    int _dataMinNodes = TMINNODES;

    int dataFileId = 0;
    int dataSize = 0;
    int dataNumDims = 0;
    int dataElemSize = 0;
    int dataElemRealSize = 0;
    int dataMaxNodes = 0;
    int dataMinNodes = 0;

    a_stream.Read(dataFileId);
    a_stream.Read(dataSize);
    a_stream.Read(dataNumDims);
    a_stream.Read(dataElemSize);
    a_stream.Read(dataElemRealSize);
    a_stream.Read(dataMaxNodes);
    a_stream.Read(dataMinNodes);

    bool result = false;

    // Test if header was valid and compatible
    if ((dataFileId == _dataFileId) && (dataSize == _dataSize) && (dataNumDims == _dataNumDims) && (dataElemSize == _dataElemSize) && (dataElemRealSize == _dataElemRealSize) && (dataMaxNodes == _dataMaxNodes) &&
        (dataMinNodes == _dataMinNodes)) {
        // Recursively load tree
        result = LoadRec(m_root, a_stream);
    }

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::LoadRTree(const char* a_fileName, satStruct& satSet) {
    RemoveAll();  // Clear existing tree

    RTFileStream stream;
    if (!stream.OpenRead(a_fileName)) {
        return false;
    }

    bool result = LoadRTree(stream, satSet);

    stream.Close();

    return result;
}


RTREE_TEMPLATE
bool RTREE_QUAL::LoadRTree(RTFileStream& a_stream, satStruct& satSet) {
    int dataFileId = ('R' << 0) | ('T' << 8) | ('R' << 16) | ('E' << 24);
    a_stream.Read(dataFileId);
    a_stream.Read(useHash);
    a_stream.Read(useDifference);
    a_stream.Read(useLayer);
    a_stream.Read(layerMul);
    a_stream.Read(useForSplit);
    satSet._useHash = useHash;
    satSet._useDiffernce = useDifference;
    satSet._useLayer = useLayer;
    satSet._layerMul = layerMul;
    bool result = LoadRecAll(m_root, NULL, a_stream);
    return result;
}
RTREE_TEMPLATE
bool RTREE_QUAL::LoadRecAll(Node* a_node, Branch* preBranch, RTFileStream& a_stream) {
    a_stream.Read(a_node->m_level);
    a_stream.Read(a_node->m_count);
    a_stream.Read(a_node->satId);

    Rect tt; 
    a_stream.ReadArray(tt.m_min, NUMDIMS);
    a_stream.ReadArray(tt.m_max, NUMDIMS);
    for(int i = 0; i < NUMDIMS; ++i) tt.m_max[i] --;
    // for(int i = 0; i < NUMDIMS; ++i) printf("%d %d| ", tt.m_min[i], tt.m_max[i]); printf("%d %d %d\n", a_node->m_count, a_node->satId, a_node->m_level);

    if(preBranch != NULL) {
        preBranch->m_rect = tt;
    }
    
    if (!a_node->IsInternalNode())  return true;

    for (int index = 0; index < a_node->m_count; ++index) {
        Branch* curBranch = &a_node->m_branch[index];
        curBranch->m_child = AllocNode();
        LoadRecAll(curBranch->m_child, curBranch, a_stream);
    }

    return true;  // Should do more error checking on I/O operations


}



RTREE_TEMPLATE
bool RTREE_QUAL::LoadSAT(const char* a_fileName, satStruct& satSet) {
    // RemoveAll();  // Clear existing tree

    RTFileStream stream;
    if (!stream.OpenRead(a_fileName)) {
        return false;
    }

    bool result = LoadSAT(stream, satSet);
    
    stream.Close();

    for(int i = 0, cnt = 0; i < satTot; i += 50, cnt ++) {
        RTFileStream stream2;
        string tt = string(a_fileName) + '_' + to_string(cnt);
        // cout << tt << endl;
        if (!stream2.OpenRead(tt.c_str())) {
            return false;
        }
        for(int j = i; j < min(satTot, i + 50); ++j) {
            satSet._sumTable = SATPOOL + satOffset;
            sat[j].init(satSet);
            satOffset += sat[j].read(stream2) + 1;
        }
        stream2.Close();
    }
    return result;
}




RTREE_TEMPLATE
bool RTREE_QUAL::LoadSAT(RTFileStream& a_stream, satStruct& satSet) {
    int dataFileId = ('S' << 0) | ('A' << 8) | ('T' << 16) | ('A' << 24);
    a_stream.Read(dataFileId);
    a_stream.Read(satTot);

    satOffset = 0;
    // for(int i = 0; i < satTot; ++i) {
    //     satSet._sumTable = SATPOOL + satOffset;
    //     sat[i].init(satSet);
    //     satOffset += sat[i].read(a_stream) + 1;
    // }
    return true;
}



RTREE_TEMPLATE
bool RTREE_QUAL::LoadRec(Node* a_node, RTFileStream& a_stream) {
    a_stream.Read(a_node->m_level);
    a_stream.Read(a_node->m_count);

    if (a_node->IsInternalNode())  // not a leaf node
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            Branch* curBranch = &a_node->m_branch[index];

            a_stream.ReadArray(curBranch->m_rect.m_min, NUMDIMS);
            a_stream.ReadArray(curBranch->m_rect.m_max, NUMDIMS);

            curBranch->m_child = AllocNode(); 
            LoadRec(curBranch->m_child, a_stream);
        }
    } else  // A leaf node
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            Branch* curBranch = &a_node->m_branch[index];

            a_stream.ReadArray(curBranch->m_rect.m_min, NUMDIMS);
            a_stream.ReadArray(curBranch->m_rect.m_max, NUMDIMS);

            a_stream.Read(curBranch->m_data);
        }
    }

    return true;  // Should do more error checking on I/O operations
}

RTREE_TEMPLATE
void RTREE_QUAL::CopyRec(Node* current, Node* other) {
    current->m_level = other->m_level;
    current->m_count = other->m_count;

    if (current->IsInternalNode())  // not a leaf node
    {
        for (int index = 0; index < current->m_count; ++index) {
            Branch* currentBranch = &current->m_branch[index];
            Branch* otherBranch = &other->m_branch[index];

            std::copy(otherBranch->m_rect.m_min, otherBranch->m_rect.m_min + NUMDIMS, currentBranch->m_rect.m_min);

            std::copy(otherBranch->m_rect.m_max, otherBranch->m_rect.m_max + NUMDIMS, currentBranch->m_rect.m_max);

            currentBranch->m_child = AllocNode();
            CopyRec(currentBranch->m_child, otherBranch->m_child);
        }
    } else  // A leaf node
    {
        for (int index = 0; index < current->m_count; ++index) {
            Branch* currentBranch = &current->m_branch[index];
            Branch* otherBranch = &other->m_branch[index];

            std::copy(otherBranch->m_rect.m_min, otherBranch->m_rect.m_min + NUMDIMS, currentBranch->m_rect.m_min);

            std::copy(otherBranch->m_rect.m_max, otherBranch->m_rect.m_max + NUMDIMS, currentBranch->m_rect.m_max);

            currentBranch->m_data = otherBranch->m_data;
        }
    }
}

RTREE_TEMPLATE
bool RTREE_QUAL::Save(const char* a_fileName) {
    RTFileStream stream;
    if (!stream.OpenWrite(a_fileName)) {
        return false;
    }

    bool result = Save(stream);

    stream.Close();

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::Save(RTFileStream& a_stream) {
    // Write some kind of header
    int dataFileId = ('R' << 0) | ('T' << 8) | ('R' << 16) | ('E' << 24);
    int dataSize = sizeof(DATATYPE);
    int dataNumDims = NUMDIMS;
    int dataElemSize = sizeof(ELEMTYPE);
    int dataElemRealSize = sizeof(ELEMTYPEREAL);
    int dataMaxNodes = TMAXNODES;
    int dataMinNodes = TMINNODES;

    a_stream.Write(dataFileId);
    a_stream.Write(dataSize);
    a_stream.Write(dataNumDims);
    a_stream.Write(dataElemSize);
    a_stream.Write(dataElemRealSize);
    a_stream.Write(dataMaxNodes);
    a_stream.Write(dataMinNodes);
    a_stream.Write(AllofNode);
    printf("our tree has %d nodes\n", AllofNode);
    // Recursively save tree
    bool result = SaveRec(m_root, a_stream);

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveAll(const char* a_fileName) {
    RTFileStream stream;
    if (!stream.OpenWrite(a_fileName)) {
        return false;
    }

    bool result = SaveAll(stream);

    stream.Close();

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveParameter(const char* a_fileName, satStruct& parameter) {
    RTFileStream stream;
    if (!stream.OpenWrite(a_fileName)) {
        return false;
    }

    bool result = SaveParameter(stream, parameter);

    stream.Close();

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveRTree(const char* a_fileName) {
    RTFileStream stream;
    if (!stream.OpenWrite(a_fileName)) {
        return false;
    }

    bool result = SaveRTree(stream);

    stream.Close();

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveSAT(const char* a_fileName) {
    RTFileStream stream;
    if (!stream.OpenWrite(a_fileName)) {
        return false;
    }

    bool result = SaveSAT(stream);
    if(savePart) {
        for(int i = 0, cnt = 0; i < satTot; i += 50, cnt ++) {
            RTFileStream stream2;
            string tt = string(a_fileName) + '_' + to_string(cnt);
            // cout << tt << endl;
            if (!stream2.OpenWrite(tt.c_str())) {
                return false;
            }
            for(int j = i; j < min(satTot, i + 50); ++j) sat[j].save(stream2);
            stream2.Close();
        }
    } else {
        for(int i = 0; i < satTot; ++i) sat[i].save(stream);
    }
    stream.Close();

    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveParameter(RTFileStream& a_stream, satStruct& parameter) {
    a_stream.WriteInt(NUMDIMS);
    a_stream.WriteInt(INNDIMS);
    // a_stream.WriteIntArray(numdimLimit, NUMDIMS);
    return true;
}
RTREE_TEMPLATE
bool RTREE_QUAL::SaveRTree(RTFileStream& a_stream) {
    int dataFileId = ('R' << 0) | ('T' << 8) | ('R' << 16) | ('E' << 24);
    a_stream.Write(dataFileId);
    a_stream.Write(useHash);
    a_stream.Write(useDifference);
    a_stream.Write(useLayer);
    a_stream.Write(layerMul);
    a_stream.Write(useForSplit);
    bool result = SaveRecAll(m_root, a_stream);
    return result;
}
RTREE_TEMPLATE
bool RTREE_QUAL::SaveSAT(RTFileStream& a_stream) {
    int dataFileId = ('S' << 0) | ('A' << 8) | ('T' << 16) | ('A' << 24);
    a_stream.Write(dataFileId);
    a_stream.Write(satTot);
    // for(int i = 0; i < satTot; ++i) {
    //     sat[i].save(a_stream);
    // }
    return true;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveAll(RTFileStream& a_stream) {
    // Write some kind of header
    int dataFileId = ('R' << 0) | ('T' << 8) | ('R' << 16) | ('E' << 24);
    int dataSize = sizeof(DATATYPE);
    int dataNumDims = NUMDIMS;
    int dataElemSize = sizeof(ELEMTYPE);
    int dataElemRealSize = sizeof(ELEMTYPEREAL);
    int dataMaxNodes = TMAXNODES;
    int dataMinNodes = TMINNODES;

    a_stream.Write(dataFileId);
    // a_stream.Write(dataSize);
    a_stream.Write(dataNumDims);
    a_stream.Write(satTot);
    // a_stream.Write(dataElemSize);
    // a_stream.Write(dataElemRealSize);
    // a_stream.Write(dataMaxNodes);
    // a_stream.Write(dataMinNodes);
    sat[0].saveCooDivideNum(a_stream);
    // Recursively save tree
    for(int i = 0; i < satTot; ++i) {
        sat[i].save(a_stream);
    }

    Rect tt = NodeCover(m_root);
    a_stream.Write(m_root->m_level);
    a_stream.Write(m_root->m_count);
    a_stream.WriteArray(tt.m_min, NUMDIMS);
    a_stream.WriteArray(tt.m_max, NUMDIMS);
    bool result = SaveRecAll(m_root, a_stream);

    
    return result;
}

RTREE_TEMPLATE
bool RTREE_QUAL::SaveRec(Node* a_node, RTFileStream& a_stream) {
    a_stream.Write(a_node->m_level);
    a_stream.Write(a_node->m_count);

    if (a_node->IsInternalNode())  // not a leaf node
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            Branch* curBranch = &a_node->m_branch[index];

            a_stream.WriteArray(curBranch->m_rect.m_min, NUMDIMS);
            a_stream.WriteArray(curBranch->m_rect.m_max, NUMDIMS);

            SaveRec(curBranch->m_child, a_stream);
        }
    } else  // A leaf node
    { 
        for (int index = 0; index < a_node->m_count; ++index) {
            Branch* curBranch = &a_node->m_branch[index];

            a_stream.WriteArray(curBranch->m_rect.m_min, NUMDIMS);
            a_stream.WriteArray(curBranch->m_rect.m_max, NUMDIMS);

            a_stream.Write(curBranch->m_data);
        }
    }

    return true;  // Should do more error checking on I/O operations
}


RTREE_TEMPLATE
bool RTREE_QUAL::SaveRecAll(Node* a_node, RTFileStream& a_stream) {
    a_stream.Write(a_node->m_level);
    a_stream.Write(a_node->m_count);
    a_stream.Write(a_node->satId);

    if(a_node->IsInternalNode()) {
        Rect tt = NodeCover(a_node);
        // for(int i = 0; i < NUMDIMS; ++i) printf("%d %d | ", tt.m_min[i], tt.m_max[i]); printf("%d %d\n", a_node->m_count, a_node->satId); 
        for(int i = 0; i < NUMDIMS; ++i) tt.m_max[i] ++;

        a_stream.WriteArray(tt.m_min, NUMDIMS);
        a_stream.WriteArray(tt.m_max, NUMDIMS);
    } else sat[a_node->satId].saveDomain(a_stream);  
    
    if (!a_node->IsInternalNode())  return true;

    for (int index = 0; index < a_node->m_count; ++index) {
        Branch* curBranch = &a_node->m_branch[index];
        SaveRecAll(curBranch->m_child, a_stream);
    }

    return true;  // Should do more error checking on I/O operations
}

RTREE_TEMPLATE
void RTREE_QUAL::RemoveAll() {
    // Delete all existing nodes
    Reset();

    m_root = AllocNode();
    m_root->m_level = 0;
}

RTREE_TEMPLATE
void RTREE_QUAL::Reset() {
#ifdef RTREE_DONT_USE_MEMPOOLS
    // Delete all existing nodes
    RemoveAllRec(m_root);
#else   // RTREE_DONT_USE_MEMPOOLS
// Just reset memory pools.  We are not using complex types
// EXAMPLE
#endif  // RTREE_DONT_USE_MEMPOOLS
}

RTREE_TEMPLATE
void RTREE_QUAL::RemoveAllRec(Node* a_node) {
    // // ASSERT(a_node);
    // // ASSERT(a_node->m_level >= 0);

    if (a_node->IsInternalNode())  // This is an internal node in the tree
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            RemoveAllRec(a_node->m_branch[index].m_child);
        }
    }
    FreeNode(a_node);
}

RTREE_TEMPLATE
typename RTREE_QUAL::Node* RTREE_QUAL::AllocNode() {
    AllofNode ++;
    Node* newNode;
#ifdef RTREE_DONT_USE_MEMPOOLS
    newNode = new Node;
#else   // RTREE_DONT_USE_MEMPOOLS
// EXAMPLE
#endif  // RTREE_DONT_USE_MEMPOOLS
    InitNode(newNode);
    return newNode;
}

RTREE_TEMPLATE
void RTREE_QUAL::FreeNode(Node* a_node) {
    // // ASSERT(a_node);

#ifdef RTREE_DONT_USE_MEMPOOLS
    delete a_node;
#else   // RTREE_DONT_USE_MEMPOOLS
// EXAMPLE
#endif  // RTREE_DONT_USE_MEMPOOLS
}

// Allocate space for a node in the list used in DeletRect to
// store Nodes that are too empty.
RTREE_TEMPLATE
typename RTREE_QUAL::ListNode* RTREE_QUAL::AllocListNode() {
#ifdef RTREE_DONT_USE_MEMPOOLS
    return new ListNode;
#else   // RTREE_DONT_USE_MEMPOOLS
// EXAMPLE
#endif  // RTREE_DONT_USE_MEMPOOLS
}

RTREE_TEMPLATE
void RTREE_QUAL::FreeListNode(ListNode* a_listNode) {
#ifdef RTREE_DONT_USE_MEMPOOLS
    delete a_listNode;
#else   // RTREE_DONT_USE_MEMPOOLS
// EXAMPLE
#endif  // RTREE_DONT_USE_MEMPOOLS
}

RTREE_TEMPLATE
void RTREE_QUAL::InitNode(Node* a_node) {
    a_node->m_count = 0;
    a_node->m_level = -1;
}

RTREE_TEMPLATE
void RTREE_QUAL::InitRect(Rect* a_rect) {
    for (int index = 0; index < NUMDIMS; ++index) {
        a_rect->m_min[index] = (ELEMTYPE) 0;
        a_rect->m_max[index] = (ELEMTYPE) 0;
    }
}

// Inserts a new data rectangle into the index structure.
// Recursively descends tree, propagates splits back up.
// Returns 0 if node was not split.  Old node updated.
// If node was split, returns 1 and sets the pointer pointed to by
// new_node to point to the new node.  Old node updated to become one of two.
// The level argument specifies the number of steps up from the leaf
// level to insert; e.g. a data rectangle goes in at level = 0.
RTREE_TEMPLATE
bool RTREE_QUAL::InsertRectRec(const Branch& a_branch, Node* a_node, Node** a_newNode, int a_level) {
    // // ASSERT(a_node && a_newNode);
    // // ASSERT(a_level >= 0 && a_level <= a_node->m_level);

    // recurse until we reach the correct level for the new record. data records
    // will always be called with a_level == 0 (leaf)
    if (a_node->m_level > a_level) {
        // Still above level for insertion, go down tree recursively
        Node* otherNode;

        // find the optimal branch for this record
        // int index = a_node->m_level <= 1 ? PickBranchDiffusion(&a_branch.m_rect, a_node) : PickBranch(&a_branch.m_rect, a_node);
        int index = PickBranch(&a_branch.m_rect, a_node);
        // int index = PickBranchDiffusion(&a_branch.m_rect, a_node);

        // recursively insert this record into the picked branch
        bool childWasSplit = InsertRectRec(a_branch, a_node->m_branch[index].m_child, &otherNode, a_level);

        if (!childWasSplit) {
            // Child was not split. Merge the bounding box of the new record with the
            // existing bounding box
            a_node->m_branch[index].m_rect = CombineRect(&a_branch.m_rect, &(a_node->m_branch[index].m_rect));
            return false;
        } else {
            // Child was split. The old branches are now re-partitioned to two nodes
            // so we have to re-calculate the bounding boxes of each node
            a_node->m_branch[index].m_rect = NodeCover(a_node->m_branch[index].m_child);
            Branch branch;
            branch.m_child = otherNode;
            branch.m_rect = NodeCover(otherNode);

            // The old node is already a child of a_node. Now add the newly-created
            // node to a_node as well. a_node might be split because of that.
            return AddBranch(&branch, a_node, a_newNode);
        }
    } else if (a_node->m_level == a_level) {
        // We have reached level for insertion. Add rect, split if necessary
        return AddBranch(&a_branch, a_node, a_newNode);
    } else {
        // Should never occur
        // ASSERT(0);
        return false;
    }
}

RTREE_TEMPLATE
void RTREE_QUAL::InsertRectChangeRect(Node* a_node, int a_level, const ELEMTYPE* a_min, INNTYPE* insertData) {
    // ASSERT(a_node);
    // ASSERT(a_level >= 0 && a_level <= a_node->m_level);

    // recurse until we reach the correct level for the new record. data records
    // will always be called with a_level == 0 (leaf)
    if (a_node->m_level > a_level) {
        // Still above level for insertion, go down tree recursively
        Node* otherNode;

        // find the optimal branch for this record
        int index = PickBranch(a_min, a_node);

        // recursively insert this record into the picked branch
        a_node->m_branch[index].m_rect = CombineRect(&(a_node->m_branch[index].m_rect), a_min);
        InsertRectChangeRect(a_node->m_branch[index].m_child, a_level, a_min, insertData);   
    } else if (a_node->m_level == a_level) {
        // sat[a_node->satId].updateDomain(a_min, insertData);
        return;
    } else {
        // ASSERT(0);
    }
}

RTREE_TEMPLATE
bool RTREE_QUAL::InsertRectNotModify(Node* a_node, int a_level, const ELEMTYPE* a_min, INNTYPE* insertData) {
    // ASSERT(a_node);
    // ASSERT(a_level >= 0 && a_level <= a_node->m_level);
    if (a_node->m_level > a_level) {
        for (int index = 0; index < a_node->m_count; ++index) {
            if (Overlap(a_min, &a_node->m_branch[index].m_rect)) {
                bool insert = InsertRectNotModify(a_node->m_branch[index].m_child, a_level, a_min, insertData);
                if(insert == true) {
                    if(useLayer) useHash ? sat[a_node->satId].insertToHashTable(a_min, insertData) : sat[a_node->satId].insertToTable(a_min, insertData);
                    return true;
                }
            }
        }
        return false;
    } else if (a_node->m_level == 0) {
        insertTime ++;
        useHash ? sat[a_node->satId].insertToHashTable(a_min, insertData) : sat[a_node->satId].insertToTable(a_min, insertData);
        return true;
    } else {
        // Should never occur
        // ASSERT(0);
    }
}


// Insert a data rectangle into an index structure.
// InsertRect provides for splitting the root;
// returns 1 if root was split, 0 if it was not.
// The level argument specifies the number of steps up from the leaf
// level to insert; e.g. a data rectangle goes in at level = 0.
// InsertRect2 does the recursion.
//
RTREE_TEMPLATE
bool RTREE_QUAL::InsertRect(const Branch& a_branch, Node** a_root, int a_level) {
    // ASSERT(a_root);
    // ASSERT(a_level >= 0 && a_level <= (*a_root)->m_level);
#ifdef _DEBUG
    for (int index = 0; index < NUMDIMS; ++index) {
        // ASSERT(a_branch.m_rect.m_min[index] <= a_branch.m_rect.m_max[index]);
    }
#endif  //_DEBUG

    Node* newNode;

    if (InsertRectRec(a_branch, *a_root, &newNode, a_level))  // Root split
    {
        // Grow tree taller and new root
        Node* newRoot = AllocNode();
        newRoot->m_level = (*a_root)->m_level + 1;

        Branch branch;

        // add old root node as a child of the new root
        branch.m_rect = NodeCover(*a_root);
        branch.m_child = *a_root;
        AddBranch(&branch, newRoot, NULL);

        // add the split node as a child of the new root
        branch.m_rect = NodeCover(newNode);
        branch.m_child = newNode;
        AddBranch(&branch, newRoot, NULL);

        // set the new root as the root node
        *a_root = newRoot;

        return true;
    }

    return false;
}

// Find the smallest rectangle that includes all rectangles in branches of a node.
RTREE_TEMPLATE
typename RTREE_QUAL::Rect RTREE_QUAL::NodeCover(Node* a_node) {
    // ASSERT(a_node);

    Rect rect = a_node->m_branch[0].m_rect;
    for (int index = 1; index < a_node->m_count; ++index) {
        rect = CombineRect(&rect, &(a_node->m_branch[index].m_rect));
    }

    return rect;
}

// Add a branch to a node.  Split the node if necessary.
// Returns 0 if node not split.  Old node updated.
// Returns 1 if node split, sets *new_node to address of new node.
// Old node updated, becomes one of two.
RTREE_TEMPLATE
bool RTREE_QUAL::AddBranch(const Branch* a_branch, Node* a_node, Node** a_newNode) {
    // ASSERT(a_branch);
    // ASSERT(a_node);
    if (a_node->m_count < ( (a_node->m_level == 0) ? LEAFMAX : TMAXNODES) ) // Split won't be necessary
    // if (a_node->m_count < LEAFMAX ) // Split won't be necessary
    {
        a_node->m_branch[a_node->m_count] = *a_branch;
        ++a_node->m_count;

        return false;
    } else {
        // ASSERT(a_newNode);

        (a_node->m_level == 0) ? SplitNode(a_node, a_branch, a_newNode, LEAFMAX, LEAFMIN) : SplitNode(a_node, a_branch, a_newNode, TMAXNODES, TMINNODES);
        // SplitNode(a_node, a_branch, a_newNode, LEAFMAX, LEAFMIN);

        return true;
    }
}

// Disconnect a dependent node.
// Caller must return (or stop using iteration index) after this as count has changed
RTREE_TEMPLATE
void RTREE_QUAL::DisconnectBranch(Node* a_node, int a_index) {
    // ASSERT(a_node && (a_index >= 0) && (a_index < TMAXNODES));
    // ASSERT(a_node->m_count > 0);

    // Remove element by swapping with the last element to prevent gaps in array
    a_node->m_branch[a_index] = a_node->m_branch[a_node->m_count - 1];

    --a_node->m_count;
}

// Pick a branch.  Pick the one that will need the smallest increase
// in area to accomodate the new rectangle.  This will result in the
// least total area for the covering rectangles in the current node.
// In case of a tie, pick the one which was smaller before, to get
// the best resolution when searching.
RTREE_TEMPLATE
int RTREE_QUAL::PickBranch(const Rect* a_rect, Node* a_node) {
    // ASSERT(a_rect && a_node);

    bool firstTime = true;
    ELEMTYPEREAL increase;
    ELEMTYPEREAL bestIncr = (ELEMTYPEREAL) -1;
    ELEMTYPEREAL area;
    ELEMTYPEREAL bestArea;
    int best = 0;
    Rect tempRect;

    for (int index = 0; index < a_node->m_count; ++index) {
        Rect* curRect = &a_node->m_branch[index].m_rect;
        area = CalcRectVolume(curRect);
        tempRect = CombineRect(a_rect, curRect);
        ELEMTYPEREAL combineVolume = CalcRectVolume(&tempRect); 
        increase = (combineVolume - area) * combineVolume / area;

        // increase = (combineVolume - area);
        if ((increase < bestIncr) || firstTime) {
            best = index;
            bestArea = area;
            bestIncr = increase;
            firstTime = false;
        } else if ((increase == bestIncr) && (area < bestArea)) {
            best = index;
            bestArea = area;
            bestIncr = increase;
        }
    }
    return best;
}

RTREE_TEMPLATE
int RTREE_QUAL::PickBranchDiffusion(const Rect* a_rect, Node* a_node) {
    // ASSERT(a_rect && a_node);

    bool firstTime = true;
    ELEMTYPEREAL bestIncr = (ELEMTYPEREAL) -1;
    ELEMTYPEREAL bestArea;
    int best = 0;


    for (int index = 0; index < a_node->m_count; ++index) {
        Rect* curRect = &a_node->m_branch[index].m_rect;
        Rect tempRect = CombineRect(a_rect, curRect);
        ELEMTYPEREAL area = RectVolume(&tempRect) - RectVolume(curRect);
        ELEMTYPEREAL increase = 0;
        for(int j = 0; j < a_node->m_count; ++j) {
            if(j == index) continue;
            Rect* tmpRect = &a_node->m_branch[j].m_rect;
            Rect tt = InteractionRect(&tempRect, tmpRect);
            increase += RectVolume(&tt);
        //    printf("%.3f\n", CalcRectVolume(&tt));
        }
        increase = area;
        if ((increase < bestIncr) || firstTime) {
            best = index;
            bestArea = area;
            bestIncr = increase;
            firstTime = false;
        }
        // } else if ((increase == bestIncr) && (area < bestArea)) {
        //     best = index;
        //     bestArea = area;
        //     bestIncr = increase;
        // }
    }
    // printf("%d\n", best);
    return best;
}

RTREE_TEMPLATE
int RTREE_QUAL::PickBranch(const ELEMTYPE* a_rect, Node* a_node) {
    // ASSERT(a_rect && a_node);

    bool firstTime = true;
    ELEMTYPEREAL increase;
    ELEMTYPEREAL bestIncr = (ELEMTYPEREAL) -1;
    ELEMTYPEREAL area;
    ELEMTYPEREAL bestArea;
    int best = 0;
    Rect tempRect;

    for (int index = 0; index < a_node->m_count; ++index) {
        Rect* curRect = &a_node->m_branch[index].m_rect;
        area = CalcRectVolume(curRect);
        tempRect = CombineRect(curRect, a_rect);
        increase = CalcRectVolume(&tempRect) - area;
        if ((increase < bestIncr) || firstTime) {
            best = index;
            bestArea = area;
            bestIncr = increase;
            firstTime = false;
        } else if ((increase == bestIncr) && (area < bestArea)) {
            best = index;
            bestArea = area;
            bestIncr = increase;
        }
    }
    return best;
}

RTREE_TEMPLATE
typename RTREE_QUAL::Rect RTREE_QUAL::CombineRect(const Rect* a_rectA, const ELEMTYPE* insertData) {
    // ASSERT(a_rectA);

    Rect newRect;

    for (int index = 0; index < NUMDIMS; ++index) {
        newRect.m_min[index] = Min(a_rectA->m_min[index], insertData[index]);
        newRect.m_max[index] = Max(a_rectA->m_max[index], insertData[index]);
    }

    return newRect;
}


// Combine two rectangles into larger one containing both
RTREE_TEMPLATE
typename RTREE_QUAL::Rect RTREE_QUAL::CombineRect(const Rect* a_rectA, const Rect* a_rectB) {
    // ASSERT(a_rectA && a_rectB);

    Rect newRect;

    for (int index = 0; index < NUMDIMS; ++index) {
        newRect.m_min[index] = Min(a_rectA->m_min[index], a_rectB->m_min[index]);
        newRect.m_max[index] = Max(a_rectA->m_max[index], a_rectB->m_max[index]);
    }

    return newRect;
}


RTREE_TEMPLATE
typename RTREE_QUAL::Rect RTREE_QUAL::InteractionRect(const Rect* a_rectA, const Rect* a_rectB) {
    // ASSERT(a_rectA && a_rectB);

    Rect newRect;

    for (int index = 0; index < NUMDIMS; ++index) {
        newRect.m_min[index] = Max(a_rectA->m_min[index], a_rectB->m_min[index]);
        newRect.m_max[index] = Min(a_rectA->m_max[index], a_rectB->m_max[index]);
    }

    return newRect;
}





// Split a node.
// Divides the nodes branches and the extra one between two nodes.
// Old node is one of the new ones, and one really new one is created.
// Tries more than one method for choosing a partition, uses best result.
RTREE_TEMPLATE
void RTREE_QUAL::SplitNode(Node* a_node, const Branch* a_branch, Node** a_newNode, int MAXNODES, int MINNODES) {
    // ASSERT(a_node);
    // ASSERT(a_branch);

    // printf("%d %d\n", MAXNODES, MINNODES);
    
    // Could just use local here, but member or external is faster since it is reused
    PartitionVars localVars;
    PartitionVars* parVars = &localVars;
    // Load all the branches into a buffer, initialize old node
    GetBranches(a_node, a_branch, parVars, MAXNODES, MINNODES);
    // // Find partition
    // ChoosePartition(parVars, TMINNODES);
    ChooseAxisPartition(parVars, MAXNODES, MINNODES);
    // Create a new node to hold (about) half of the branches
    *a_newNode = AllocNode();
    (*a_newNode)->m_level = a_node->m_level;
    
    // Put branches from buffer into 2 nodes according to the chosen partition
    a_node->m_count = 0;
    LoadNodes(a_node, *a_newNode, parVars);
    // ASSERT((a_node->m_count + (*a_newNode)->m_count) == parVars->m_total);
}

// Calculate the n-dimensional volume of a rectangle
RTREE_TEMPLATE
ELEMTYPEREAL RTREE_QUAL::RectVolume(Rect* a_rect) {
    // ASSERT(a_rect);

    ELEMTYPEREAL volume = (ELEMTYPEREAL) 1;

    for (int index = 0; index < useForSplit; ++index) {
        ELEMTYPEREAL tt = a_rect->m_max[index] - a_rect->m_min[index];
        volume *= tt < 0? 0 : tt;
    }

    // ASSERT(volume >= (ELEMTYPEREAL) 0);

    return volume;
}

// The exact volume of the bounding sphere for the given Rect
RTREE_TEMPLATE
ELEMTYPEREAL RTREE_QUAL::RectSphericalVolume(Rect* a_rect) {
    // ASSERT(a_rect);

    ELEMTYPEREAL sumOfSquares = (ELEMTYPEREAL) 0;
    ELEMTYPEREAL radius;

    for (int index = 0; index < useForSplit; ++index) {
        ELEMTYPEREAL halfExtent = ((ELEMTYPEREAL) a_rect->m_max[index] - (ELEMTYPEREAL) a_rect->m_min[index]) * 0.5f;
        sumOfSquares += halfExtent * halfExtent;
    }

    radius = (ELEMTYPEREAL) sqrt(sumOfSquares);

    // Pow maybe slow, so test for common dims like 2,3 and just use x*x, x*x*x.
    if (NUMDIMS == 3) {
        return (radius * radius * radius * m_unitSphereVolume);
    } else if (NUMDIMS == 2) {
        return (radius * radius * m_unitSphereVolume);
    } else {
        return (ELEMTYPEREAL)(pow(radius, NUMDIMS) * m_unitSphereVolume);
    }
}

// Use one of the methods to calculate retangle volume
RTREE_TEMPLATE
ELEMTYPEREAL RTREE_QUAL::CalcRectVolume(Rect* a_rect) {
// #ifdef RTREE_USE_SPHERICAL_VOLUME
//     return RectSphericalVolume(a_rect);  // Slower but helps certain merge cases
// #else                                    // RTREE_USE_SPHERICAL_VOLUME
    return RectVolume(a_rect);  // Faster but can cause poor merges
// #endif                                   // RTREE_USE_SPHERICAL_VOLUME
}


RTREE_TEMPLATE
ELEMTYPEREAL RTREE_QUAL::CalcRectMargin(Rect* a_rect) {
    ELEMTYPEREAL volume = (ELEMTYPEREAL) 0;

    for (int index = 0; index < useForSplit; ++index) {
        ELEMTYPEREAL tt = a_rect->m_max[index] - a_rect->m_min[index];
        volume += tt < 0? 0 : tt;
    }
    // ASSERT(volume >= (ELEMTYPEREAL) 0);
    return volume;
}

// Load branch buffer with branches from full node plus the extra branch.
RTREE_TEMPLATE
void RTREE_QUAL::GetBranches(Node* a_node, const Branch* a_branch, PartitionVars* a_parVars, int MAXNODES, int MINNODES) {
    // ASSERT(a_node);
    // ASSERT(a_branch);

    // ASSERT(a_node->m_count == MAXNODES);

    // Load the branch buffer
    for (int index = 0; index < MAXNODES; ++index) {
        a_parVars->m_branchBuf[index] = a_node->m_branch[index];
    }
    a_parVars->m_branchBuf[MAXNODES] = *a_branch;
    a_parVars->m_branchCount = MAXNODES + 1;

    // Calculate rect containing all in the set
    a_parVars->m_coverSplit = a_parVars->m_branchBuf[0].m_rect;
    for (int index = 1; index < MAXNODES + 1; ++index) {
        a_parVars->m_coverSplit = CombineRect(&a_parVars->m_coverSplit, &a_parVars->m_branchBuf[index].m_rect);
    }
    a_parVars->m_coverSplitArea = CalcRectVolume(&a_parVars->m_coverSplit);
}



RTREE_TEMPLATE
void RTREE_QUAL::ChooseAxisPartition(PartitionVars* a_parVars, int MAXNODES, int MINNODES) {
    // ASSERT(a_parVars);

    InitParVars(a_parVars, a_parVars->m_branchCount, MINNODES);

    int sortCnt[MAXNODES + 1];
    for(int j = 0; j < MAXNODES + 1; ++j) {
        a_parVars->m_branchBuf[j].sortId = j;
    }

    float minSum; bool firstChance = true; int best;
    for(int i = 0; i < useForSplit; ++i) {
        // a_parVars->chooseAxis = i;
        for(int j = 0; j < MAXNODES + 1; ++j) { 
            sortCnt[a_parVars->m_branchBuf[j].sortId] = a_parVars->m_branchBuf[j].m_rect.m_min[i];
        }
        sort(a_parVars->m_branchBuf, (a_parVars->m_branchBuf) + MAXNODES + 1, 
            [&sortCnt] (Branch &A, Branch &B) { return sortCnt[A.sortId] > sortCnt[B.sortId]; });

        float sum = 0;
        Rect tt = CombineGroupRect(a_parVars, 0, MINNODES);
        sum += CalcRectMargin(&tt);
        for(int j = MINNODES; j < MAXNODES - MINNODES + 1; ++j) {
            tt = CombineRect(&tt, &a_parVars->m_branchBuf[j].m_rect);
            sum += CalcRectMargin(&tt);
        }
        tt = CombineGroupRect(a_parVars, MAXNODES - MINNODES + 1, MAXNODES + 1);
        sum += CalcRectMargin(&tt);
        for(int j = MAXNODES - MINNODES; j >= MINNODES; --j) {
            tt = CombineRect(&tt, &a_parVars->m_branchBuf[j].m_rect);
            sum += CalcRectMargin(&tt);
        }

        if(sum < minSum || firstChance) {
            firstChance = false;
            minSum = sum;
            best = i;
        }
    }
    // printf("%d\n", best);

    if(best != NUMDIMS - 1) {
        for(int j = 0; j < MAXNODES + 1; ++j) { 
            sortCnt[a_parVars->m_branchBuf[j].sortId] = a_parVars->m_branchBuf[j].m_rect.m_min[best];
        }
        sort(a_parVars->m_branchBuf, (a_parVars->m_branchBuf) + MAXNODES + 1, 
            [&sortCnt] (Branch &A, Branch &B) { return sortCnt[A.sortId] < sortCnt[B.sortId]; });
    }

    float minOverlap, minArea; int index;
    firstChance = true;
    Rect tmp1[MAXNODES - MINNODES*2 + 2];
    Rect tmp2[MAXNODES - MINNODES*2 + 2];
    tmp1[0] = CombineGroupRect(a_parVars, 0, MINNODES);
    for(int i = MINNODES, cnt = 0; i < MAXNODES  - MINNODES + 1; ++i, ++cnt) {
        tmp1[cnt + 1] = CombineRect(&tmp1[cnt], &a_parVars->m_branchBuf[i].m_rect);
    }
    tmp2[0] = CombineGroupRect(a_parVars, MAXNODES - MINNODES + 1, MAXNODES + 1);
    for(int i = MAXNODES - MINNODES, cnt = 0; i >= MINNODES; --i, cnt ++) {
        tmp2[cnt + 1] = CombineRect(&tmp2[cnt], &a_parVars->m_branchBuf[i].m_rect);
    }
    for(int i = MINNODES, l = 0, r = MAXNODES - MINNODES*2 + 1; i <= MAXNODES  - MINNODES + 1; ++i, l++, r --) {
        // Rect box1 = CombineGroupRect(a_parVars, 0, i);
        // Rect box2 = CombineGroupRect(a_parVars, i, MAXNODES + 1);
        Rect box1 = tmp1[l]; Rect box2 = tmp2[r];
        Rect tmpbox = InteractionRect(&box1, &box2);
        float overlap = RectVolume(&tmpbox);
        float area = RectVolume(&box1) + RectVolume(&box2);

        if (overlap < minOverlap || firstChance) {
            firstChance = false;
            minOverlap = overlap;
            index = i;
            minArea = area < minArea ? area : minArea;
        } else if (overlap == minOverlap) {
            // otherwise choose distribution with minimum area
            if (area < minArea) {
                minArea = area;
                index = i;
            }
        }
    }

    for(int i = 0; i < MAXNODES + 1; ++i) {
        a_parVars->m_partition[a_parVars->m_branchBuf[i].sortId] = (i < index);
    }
    a_parVars->m_count[0] = MAXNODES - index + 1;
    a_parVars->m_count[1] = index;

    sort(a_parVars->m_branchBuf, (a_parVars->m_branchBuf) + MAXNODES + 1, 
            [] (Branch &A, Branch &B) { return A.sortId < B.sortId; });

    for(int i = 0; i < MAXNODES + 1; ++i) {
        int tt = a_parVars->m_partition[i];
        // printf("%d\n", tt);
        a_parVars->m_partition[i] = PartitionVars::NOT_TAKEN;
        Classify(i, tt, a_parVars);
    }
    // for(int i = 0; i < index < a_parVars->m_total; ++i) {
    //     printf("%d ", a_parVars->m_partition[i]);
    // }
    // printf("\n");
}




// Method #0 for choosing a partition:
// As the seeds for the two groups, pick the two rects that would waste the
// most area if covered by a single rectangle, i.e. evidently the worst pair
// to have in the same group.
// Of the remaining, one at a time is chosen to be put in one of the two groups.
// The one chosen is the one with the greatest difference in area expansion
// depending on which group - the rect most strongly attracted to one group
// and repelled from the other.
// If one group gets too full (more would force other group to violate min
// fill requirement) then other group gets the rest.
// These last are the ones that can go in either group most easily.
RTREE_TEMPLATE
void RTREE_QUAL::ChoosePartition(PartitionVars* a_parVars, int a_minFill) {
    // ASSERT(a_parVars);

    ELEMTYPEREAL biggestDiff;
    int group, chosen = 0, betterGroup = 0;

    InitParVars(a_parVars, a_parVars->m_branchCount, a_minFill);
    PickSeeds(a_parVars);

    while (((a_parVars->m_count[0] + a_parVars->m_count[1]) < a_parVars->m_total) && (a_parVars->m_count[0] < (a_parVars->m_total - a_parVars->m_minFill)) && (a_parVars->m_count[1] < (a_parVars->m_total - a_parVars->m_minFill))) {
        biggestDiff = (ELEMTYPEREAL) -1;
        for (int index = 0; index < a_parVars->m_total; ++index) {
            if (PartitionVars::NOT_TAKEN == a_parVars->m_partition[index]) {
                Rect* curRect = &a_parVars->m_branchBuf[index].m_rect;
                Rect rect0 = CombineRect(curRect, &a_parVars->m_cover[0]);
                Rect rect1 = CombineRect(curRect, &a_parVars->m_cover[1]);
                ELEMTYPEREAL growth0 = CalcRectVolume(&rect0) - a_parVars->m_area[0];
                ELEMTYPEREAL growth1 = CalcRectVolume(&rect1) - a_parVars->m_area[1];
                ELEMTYPEREAL diff = growth1 - growth0;
                if (diff >= 0) {
                    group = 0;
                } else {
                    group = 1;
                    diff = -diff;
                }

                if (diff > biggestDiff) {
                    biggestDiff = diff;
                    chosen = index;
                    betterGroup = group;
                } else if ((diff == biggestDiff) && (a_parVars->m_count[group] < a_parVars->m_count[betterGroup])) {
                    chosen = index;
                    betterGroup = group;
                }
            }
        }
        Classify(chosen, betterGroup, a_parVars);
    }

    // If one group too full, put remaining rects in the other
    if ((a_parVars->m_count[0] + a_parVars->m_count[1]) < a_parVars->m_total) {
        if (a_parVars->m_count[0] >= a_parVars->m_total - a_parVars->m_minFill) {
            group = 1;
        } else {
            group = 0;
        }
        for (int index = 0; index < a_parVars->m_total; ++index) {
            if (PartitionVars::NOT_TAKEN == a_parVars->m_partition[index]) {
                Classify(index, group, a_parVars);
            }
        }
    }

    // ASSERT((a_parVars->m_count[0] + a_parVars->m_count[1]) == a_parVars->m_total);
    // ASSERT((a_parVars->m_count[0] >= a_parVars->m_minFill) && (a_parVars->m_count[1] >= a_parVars->m_minFill));
}

// Copy branches from the buffer into two nodes according to the partition.
RTREE_TEMPLATE
void RTREE_QUAL::LoadNodes(Node* a_nodeA, Node* a_nodeB, PartitionVars* a_parVars) {
    // ASSERT(a_nodeA);
    // ASSERT(a_nodeB);
    // ASSERT(a_parVars);

    for (int index = 0; index < a_parVars->m_total; ++index) {
        // ASSERT(a_parVars->m_partition[index] == 0 || a_parVars->m_partition[index] == 1);

        int targetNodeIndex = a_parVars->m_partition[index];
        Node* targetNodes[] = {a_nodeA, a_nodeB};

        // It is assured that AddBranch here will not cause a node split.
        bool nodeWasSplit = AddBranch(&a_parVars->m_branchBuf[index], targetNodes[targetNodeIndex], NULL);
        // ASSERT(!nodeWasSplit);
    }
}

// Initialize a PartitionVars structure.
RTREE_TEMPLATE
void RTREE_QUAL::InitParVars(PartitionVars* a_parVars, int a_maxRects, int a_minFill) {
    // ASSERT(a_parVars);

    a_parVars->m_count[0] = a_parVars->m_count[1] = 0;
    a_parVars->m_area[0] = a_parVars->m_area[1] = (ELEMTYPEREAL) 0;
    a_parVars->m_total = a_maxRects;
    a_parVars->m_minFill = a_minFill;
    for (int index = 0; index < a_maxRects; ++index) {
        a_parVars->m_partition[index] = PartitionVars::NOT_TAKEN;
    }
}

RTREE_TEMPLATE
void RTREE_QUAL::PickSeeds(PartitionVars* a_parVars) {
    int seed0 = 0, seed1 = 0;
    ELEMTYPEREAL worst, waste;
    ELEMTYPEREAL area[TMAXNODES + 1];

    for (int index = 0; index < a_parVars->m_total; ++index) {
        area[index] = CalcRectVolume(&a_parVars->m_branchBuf[index].m_rect);
    }

    worst = -a_parVars->m_coverSplitArea - 1;
    for (int indexA = 0; indexA < a_parVars->m_total - 1; ++indexA) {
        for (int indexB = indexA + 1; indexB < a_parVars->m_total; ++indexB) {
            Rect oneRect = CombineRect(&a_parVars->m_branchBuf[indexA].m_rect, &a_parVars->m_branchBuf[indexB].m_rect);
            waste = CalcRectVolume(&oneRect) - area[indexA] - area[indexB];
            if (waste > worst) {
                worst = waste;
                seed0 = indexA;
                seed1 = indexB;
            }
        }
    }

    Classify(seed0, 0, a_parVars);
    Classify(seed1, 1, a_parVars);
}

// Put a branch in one of the groups.
RTREE_TEMPLATE
void RTREE_QUAL::Classify(int a_index, int a_group, PartitionVars* a_parVars) {
    // ASSERT(a_parVars);
    // ASSERT(PartitionVars::NOT_TAKEN == a_parVars->m_partition[a_index]);

    a_parVars->m_partition[a_index] = a_group;

    // Calculate combined rect
    if (a_parVars->m_count[a_group] == 0) {
        a_parVars->m_cover[a_group] = a_parVars->m_branchBuf[a_index].m_rect;
    } else {
        a_parVars->m_cover[a_group] = CombineRect(&a_parVars->m_branchBuf[a_index].m_rect, &a_parVars->m_cover[a_group]);
    }

    // Calculate volume of combined rect
    a_parVars->m_area[a_group] = CalcRectVolume(&a_parVars->m_cover[a_group]);

    ++a_parVars->m_count[a_group];
}

// Delete a data rectangle from an index structure.
// Pass in a pointer to a Rect, the tid of the record, ptr to ptr to root node.
// Returns 1 if record not found, 0 if success.
// RemoveRect provides for eliminating the root.
RTREE_TEMPLATE
bool RTREE_QUAL::RemoveRect(Rect* a_rect, const DATATYPE& a_id, Node** a_root) {
    // ASSERT(a_rect && a_root);
    // ASSERT(*a_root);

    ListNode* reInsertList = NULL;

    if (!RemoveRectRec(a_rect, a_id, *a_root, &reInsertList)) {
        // Found and deleted a data item
        // Reinsert any branches from eliminated nodes
        while (reInsertList) {
            Node* tempNode = reInsertList->m_node;

            for (int index = 0; index < tempNode->m_count; ++index) {
                // TODO go over this code. should I use (tempNode->m_level - 1)?
                InsertRect(tempNode->m_branch[index], a_root, tempNode->m_level);
            }

            ListNode* remLNode = reInsertList;
            reInsertList = reInsertList->m_next;

            FreeNode(remLNode->m_node);
            FreeListNode(remLNode);
        }

        // Check for redundant root (not leaf, 1 child) and eliminate TODO replace
        // if with while? In case there is a whole branch of redundant roots...
        if ((*a_root)->m_count == 1 && (*a_root)->IsInternalNode()) {
            Node* tempNode = (*a_root)->m_branch[0].m_child;

            // ASSERT(tempNode);
            FreeNode(*a_root);
            *a_root = tempNode;
        }
        return false;
    } else {
        return true;
    }
}

// Delete a rectangle from non-root part of an index structure.
// Called by RemoveRect.  Descends tree recursively,
// merges branches on the way back up.
// Returns 1 if record not found, 0 if success.
RTREE_TEMPLATE
bool RTREE_QUAL::RemoveRectRec(Rect* a_rect, const DATATYPE& a_id, Node* a_node, ListNode** a_listNode) {
    // ASSERT(a_rect && a_node && a_listNode);
    // ASSERT(a_node->m_level >= 0);

    if (a_node->IsInternalNode())  // not a leaf node
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            if (Overlap(a_rect, &(a_node->m_branch[index].m_rect))) {
                if (!RemoveRectRec(a_rect, a_id, a_node->m_branch[index].m_child, a_listNode)) {
                    if (a_node->m_branch[index].m_child->m_count >= TMINNODES) {
                        // child removed, just resize parent rect
                        a_node->m_branch[index].m_rect = NodeCover(a_node->m_branch[index].m_child);
                    } else {
                        // child removed, not enough entries in node, eliminate node
                        ReInsert(a_node->m_branch[index].m_child, a_listNode);
                        DisconnectBranch(a_node, index);  // Must return after this call as count has changed
                    }
                    return false;
                }
            }
        }
        return true;
    } else  // A leaf node
    {
        for (int index = 0; index < a_node->m_count; ++index) {
            if (a_node->m_branch[index].m_data == a_id) {
                DisconnectBranch(a_node, index);  // Must return after this call as count has changed
                return false;
            }
        }
        return true;
    }
}

// Decide whether two rectangles overlap.
RTREE_TEMPLATE
bool RTREE_QUAL::Overlap(Rect* a_rectA, Rect* a_rectB) const {
    // ASSERT(a_rectA && a_rectB);
    for (int index = 0; index < NUMDIMS; ++index) {
        if (a_rectA->m_min[index] > a_rectB->m_max[index] || a_rectB->m_min[index] > a_rectA->m_max[index]) {
            return false;
        }
    }
    return true;
}

RTREE_TEMPLATE
bool RTREE_QUAL::Overlap(const ELEMTYPE* a_rectA, Rect* a_rectB) const {
    // ASSERT(a_rectA && a_rectB);
    for (int index = 0; index < NUMDIMS; ++index) {
        if (a_rectA[index] > a_rectB->m_max[index] || a_rectB->m_min[index] > a_rectA[index]) {
            return false;
        }
    }
    return true;
}


// Add a node to the reinsertion list.  All its branches will later
// be reinserted into the index structure.
RTREE_TEMPLATE
void RTREE_QUAL::ReInsert(Node* a_node, ListNode** a_listNode) {
    ListNode* newListNode;

    newListNode = AllocListNode();
    newListNode->m_node = a_node;
    newListNode->m_next = *a_listNode;
    *a_listNode = newListNode;
}

// Search in an index tree or subtree for all data retangles that overlap the argument rectangle.
RTREE_TEMPLATE
bool RTREE_QUAL::Search(Node* a_node, Rect* a_rect, int& a_foundCount, std::function<bool(const DATATYPE&)> callback) const {
    // ASSERT(a_node);
    // ASSERT(a_node->m_level >= 0);
    // ASSERT(a_rect);

    if (a_node->IsInternalNode()) {
        // This is an internal node in the tree
        for (int index = 0; index < a_node->m_count; ++index) {
            if (Overlap(a_rect, &a_node->m_branch[index].m_rect)) {
                if (!Search(a_node->m_branch[index].m_child, a_rect, a_foundCount, callback)) {
                    // The callback indicated to stop searching
                    return false;
                }
            }
        }
    } else {
        // This is a leaf node
        for (int index = 0; index < a_node->m_count; ++index) {
            if (Overlap(a_rect, &a_node->m_branch[index].m_rect)) {
                DATATYPE& id = a_node->m_branch[index].m_data;
                ++a_foundCount;

                if (callback && !callback(id)) {
                    return false;  // Don't continue searching
                }
            }
        }
    }

    return true;  // Continue searching
}
RTREE_TEMPLATE
void RTREE_QUAL::askDfs(Node* a_node, Rect* a_rect) {
    // ASSERT(a_node);
    // ASSERT(a_node->m_level >= 0);
    // ASSERT(a_rect);
    // printf("%d\n", a_node->m_level);
    if (a_node->IsInternalNode()) {
        for (int index = 0; index < a_node->m_count; ++index) {
            if (Overlap(a_rect, &a_node->m_branch[index].m_rect)) {
                askDfs(a_node->m_branch[index].m_child, a_rect);
            }
        }
    } else {
        // printf("%d ", a_node->satId);
        useDifference ? sat[a_node->satId].calulateDifference(a_rect->m_min, a_rect->m_max, query) : sat[a_node->satId].calulate(a_rect->m_min, a_rect->m_max, query);
    }
}

RTREE_TEMPLATE
void RTREE_QUAL::debugDfs(Node* a_node) {
    // ASSERT(a_node);
    printf("%d:%d\n", a_node-> m_level, a_node->m_count);
    if (a_node->IsInternalNode()) {
        for (int index = 0; index < a_node->m_count; ++index) {
            Rect tt = a_node->m_branch[index].m_rect;
            for(int j = 0; j < NUMDIMS; ++j) {
                printf(" %d | %d ", tt.m_min[j], tt.m_max[j]);
            }
            printf("\n");
            debugDfs(a_node->m_branch[index].m_child);
        }
    } else {
        // This is a leaf node
        printf("It is the leaf!\n");
        // for (int index = 0; index < a_node->m_count; ++index) {
        //     Rect tt = a_node->m_branch[index].m_rect;
        //     for(int j = 0; j < NUMDIMS; ++j) {
        //         printf(" %d | %d ", tt.m_min[j], tt.m_max[j]);
        //     }
        //     printf("\n");
        // }
        // printf("\n");
    }
}

RTREE_TEMPLATE
void RTREE_QUAL::generateLayerDfs(Node* a_node, satStruct& parameters) {
    // ASSERT(a_node);
    // ASSERT(a_node->m_level >= 0);
    if (a_node->IsInternalNode()) {
        
        // sat.push_back(SAT<ELEMTYPE, INNTYPE, INNDIMS, NUMDIMS>());
        parameters._sumTable = SATPOOL + satOffset;
        
        Rect now = NodeCover(a_node);
        ELEMTYPEREAL sumAll = CalcRectVolume(&now);
        ELEMTYPEREAL sumSon = 0;
        for (int index = 0; index < a_node->m_count; ++index) {
             Rect* curRect = &a_node->m_branch[index].m_rect;
            sumSon += CalcRectVolume(curRect);
        }
        sumSon /= a_node->m_count;
        parameters._layerMul = Pow(layerMul, a_node->m_level) * sqrt(sumAll / sumSon);
        // printf("sumAll / sumSon =  %.3f\n", sqrt(sumAll / sumSon));

        satOffset += sat[satTot].copy(parameters) + 1;
        // sat[satTot].print();
        a_node->satId = satTot;
        // exit(0); 
        layerDfs.push_back(satTot); satTot ++;
        for (int index = 0; index < a_node->m_count; ++index) {
            parameters._domain_min = a_node->m_branch[index].m_rect.m_min;
            parameters._domain_max = a_node->m_branch[index].m_rect.m_max;
            generateLayerDfs(a_node->m_branch[index].m_child, parameters);
        }
        layerDfs.pop_back();
        
    } else {
        
        // sat.push_back(SAT<ELEMTYPE, INNTYPE, INNDIMS, NUMDIMS>());
        parameters._sumTable = SATPOOL + satOffset;
        parameters._layerMul = Pow(layerMul, a_node->m_level);
        // printf("init leaf: %d\n", satTot);
        satOffset += sat[satTot ].copy(parameters) + 1;
        a_node->satId = satTot;

        layerDfs.push_back(satTot);  satTot ++;
        for(int i = 0; i < layerDfs.size(); ++i) {
            // printf("inserting %d\n", layerDfs[i]);
            for (int index = 0; index < a_node->m_count; ++index) {
                sat[layerDfs[i]].insertToTable(a_node->m_branch[index].m_rect.m_min, Data[a_node->m_branch[index].m_data]);
            }
        }
        layerDfs.pop_back();
       
        // if(satTot % 100 == 0) printf("%d satTable: %d\n", satTot, satOffset);
    }

}


RTREE_TEMPLATE
void RTREE_QUAL::generateDfs(Node* a_node, satStruct& parameters) {
    // ASSERT(a_node);
    // ASSERT(a_node->m_level >= 0);

    if (a_node->IsInternalNode()) {
        // This is an internal node in the tree
        for (int index = 0; index < a_node->m_count; ++index) {
            if (!a_node->m_branch[index].m_child->IsInternalNode()) {
                parameters._domain_min = a_node->m_branch[index].m_rect.m_min;
                parameters._domain_max = a_node->m_branch[index].m_rect.m_max;
            }
            generateDfs(a_node->m_branch[index].m_child, parameters);
        }
    } else {
        // sat.push_back(SAT<ELEMTYPE, INNTYPE, INNDIMS, NUMDIMS>());
        parameters._partInsert = a_node->m_count;
        // parameters._satNum = satTot;
        parameters._sumTable = SATPOOL + satOffset;

        if(parameters._useHash) {
            for (int index = 0; index < a_node->m_count; ++index) {
                sat[satTot].insertToVector(a_node->m_branch[index].m_rect.m_min, Data[a_node->m_branch[index].m_data]);
            }
            satOffset += sat[satTot].copyHash(parameters) + 1;
            a_node->satId = satTot;
        }
        else {
            satOffset += sat[satTot].copy(parameters) + 1;
            a_node->satId = satTot;
            for (int index = 0; index < a_node->m_count; ++index) {
                sat[satTot].insertToTable(a_node->m_branch[index].m_rect.m_min, Data[a_node->m_branch[index].m_data]);
            }
        }
        satTot++;
        if(satTot % 100 == 0) printf("%d satTable: %lld\n", satTot, satOffset);
    }
}

RTREE_TEMPLATE INNTYPE RTREE_QUAL::Data[DATASIZE][INNDIMS];
RTREE_TEMPLATE INNTYPE RTREE_QUAL::SATPOOL[SATSIZE];
RTREE_TEMPLATE SAT<ELEMTYPE, INNTYPE, INNDIMS, NUMDIMS> RTREE_QUAL::sat[SATNODES];
#undef RTREE_TEMPLATE
#undef RTREE_QUAL

#endif  // RTREE_H
