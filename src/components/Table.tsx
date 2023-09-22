'use client'

import { Delete } from '@mui/icons-material'
import {
  Checkbox,
  IconButton,
  Table as MUITable,
  TableHead as MUITableHead,
  Paper,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableHeadProps,
  TablePagination,
  TableProps,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'
import {
  BaseSyntheticEvent,
  ChangeEvent,
  FC,
  MouseEvent,
  ReactNode,
  useMemo,
  useState,
} from 'react'

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

type Order = 'asc' | 'desc'

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

export interface TableHeadCell extends TableCellProps {
  id: string
  label: string
  cell?: (data: any) => ReactNode
  disablePadding?: boolean
}

interface EnhancedTableHeadProps extends TableHeadProps {
  headCells: TableHeadCell[]
  numSelected: number
  onRequestSort: (event: MouseEvent<HTMLSpanElement>, property: string) => void
  onSelectAllClick: (event: ChangeEvent<HTMLInputElement>) => void
  rowCount: number
  order?: Order
  orderBy?: string
  enableSelection?: boolean
}

const TableHead: FC<EnhancedTableHeadProps> = ({
  headCells,
  onSelectAllClick,
  order,
  orderBy,
  numSelected,
  rowCount,
  onRequestSort,
  enableSelection,
  ...others
}) => {
  const createSortHandler =
    (property: string) => (event: MouseEvent<HTMLSpanElement>) => {
      onRequestSort(event, property)
    }

  return (
    <MUITableHead {...others}>
      <TableRow>
        {enableSelection && (
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
        )}
        {headCells.map((headCell) => {
          const { id, label, disablePadding, ...others } = headCell
          return (
            <TableCell
              {...others}
              key={id}
              padding={disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === id ? order ?? 'asc' : false}
            >
              <TableSortLabel
                active={orderBy === id}
                direction={orderBy === id ? order ?? 'asc' : 'asc'}
                onClick={createSortHandler(id)}
                hideSortIcon={true}
              >
                {label}
              </TableSortLabel>
            </TableCell>
          )
        })}
      </TableRow>
    </MUITableHead>
  )
}

interface TableToolbarProps {
  title: string
  numSelected?: number
  enableSelection?: boolean
}

const TableToolbar: FC<TableToolbarProps> = ({
  numSelected: numSelectedProps,
  title,
  enableSelection,
}) => {
  const numSelected = numSelectedProps ?? 0
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
    >
      <Typography
        sx={{ flex: '1 1 100%' }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        {title}
      </Typography>
      {enableSelection && numSelected > 0 && (
        <>
          <Typography
            sx={{ flex: '1 1 20%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
          <Tooltip title="Delete">
            <IconButton>
              <Delete />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Toolbar>
  )
}

interface EnhancedTableProps extends TableProps {
  dataSource: { [key: string]: any }[]
  headCells: TableHeadCell[]
  wrapperClassName?: string
  title?: string
  enableSelection?: boolean
  enabledOrdering?: boolean
  enablePagnation?: boolean
  defaultOrderBy?: string
  onSort?: (event: MouseEvent<HTMLSpanElement>, property: string) => void
  onSelectAllClick?: (event: ChangeEvent<HTMLInputElement>) => void
  onRowClick?: (event: MouseEvent<HTMLTableRowElement>) => void
  onChangePage?: (
    event: BaseSyntheticEvent | MouseEvent<HTMLButtonElement> | null,
    page: number,
  ) => void
  onChangeRowsPerPage?: (event: ChangeEvent<HTMLInputElement>) => void
}

const Table: FC<EnhancedTableProps> = ({
  dataSource,
  headCells,
  wrapperClassName,
  title,
  enableSelection,
  enabledOrdering,
  enablePagnation,
  defaultOrderBy,
  onSort,
  onSelectAllClick,
  onRowClick,
  onChangePage,
  onChangeRowsPerPage,
  ...others
}) => {
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<string | undefined>(defaultOrderBy)
  const [selected, setSelected] = useState<readonly string[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(
    enablePagnation ? 5 : dataSource.length,
  )

  const handleRequestSort = (
    event: MouseEvent<HTMLSpanElement>,
    property: string,
  ) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
    if (onSort) onSort(event, property)
  }

  // 모두 선택 checkbox 클릭 시
  const handleSelectAllClick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = dataSource.map((n) => n.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
    if (onSelectAllClick) onSelectAllClick(event)
  }

  // row 클릭 시
  const handleRowClick = (
    event: MouseEvent<HTMLTableRowElement>,
    name: string,
  ) => {
    if (enableSelection) {
      const selectedIndex = selected.indexOf(name)
      let newSelected: readonly string[] = []
      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, name)
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1))
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1))
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1),
        )
      }
      setSelected(newSelected)
    }
    if (onRowClick) onRowClick(event)
  }

  const handleChangePage = (
    event: BaseSyntheticEvent | MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage)
    if (onChangePage) onChangePage(event, newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    if (onChangeRowsPerPage) onChangeRowsPerPage(event)
  }

  const isSelected = (name: string) => selected.indexOf(name) !== -1

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - dataSource.length) : 0

  const visibleRows = useMemo(
    () =>
      dataSource
        .slice()
        .sort(getComparator(order, orderBy ?? ''))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage],
  )

  return (
    <Paper className={wrapperClassName}>
      {(title || enableSelection) && (
        <TableToolbar
          title={title ?? ''}
          numSelected={selected.length}
          enableSelection={enableSelection}
        />
      )}

      <TableContainer>
        <MUITable {...others}>
          <TableHead
            headCells={headCells}
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={dataSource.length}
          />
          <TableBody>
            {visibleRows.map((row, index) => {
              const isItemSelected = isSelected(row.id)
              return (
                <TableRow
                  hover
                  onClick={(event) => handleRowClick(event, row.id)}
                  key={row.id}
                  selected={isItemSelected}
                  sx={{ cursor: 'pointer' }}
                >
                  {enableSelection && (
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" checked={isItemSelected} />
                    </TableCell>
                  )}
                  {headCells.map((headCell) => {
                    let cell = row[headCell.id]
                    return (
                      <TableCell
                        key={`${row.id}-${headCell.id}`}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                      >
                        {headCell.cell ? headCell.cell(row) : cell}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: (others.size == 'small' ? 33 : 45) * emptyRows,
                }}
              >
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </MUITable>
      </TableContainer>
      {enablePagnation && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={dataSource.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  )
}

export default Table
