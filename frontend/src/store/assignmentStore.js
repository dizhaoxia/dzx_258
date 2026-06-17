import { create } from 'zustand'

const useAssignmentStore = create((set) => ({
  assignments: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  filter: 'all',

  setAssignments: (assignments, total) => set({ assignments, total }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
  setFilter: (filter) => set({ filter }),
  setLoading: (loading) => set({ loading }),
  addAssignment: (assignment) => set((state) => ({
    assignments: [assignment, ...state.assignments],
    total: state.total + 1
  }))
}))

export default useAssignmentStore
