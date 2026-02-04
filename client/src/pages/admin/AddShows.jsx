import React, { useEffect, useState } from 'react'
import { dummyShowsData } from '../../assets/assets'
import Title from '../../components/admin/Title'
import Loading from '../../components/Loading'
import { CheckIcon, StarIcon, Trash2 as DeleteIcon } from 'lucide-react'
import { kCoverter } from '../../lib/kConverter'
import { useAppContext } from '../../context/appContext'
import toast from 'react-hot-toast'

const AddShows = () => {

  const { axios, getToken, user, image_base_url } = useAppContext()

  const currency = import.meta.env.VITE_CURRENCY
  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [dateTimeSelection, setDateTimeSelection] = useState({})
  const [dateTimeInputs, setDateTimeInputs] = useState("")
  const [showPrice, setShowPrice] = useState("")
  const [addingShow, setAddingShow] = useState(false)

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get('/api/show/now-playing', {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if (data.success) {
        setNowPlayingMovies(data.movies)
      }

    } catch (error) {
      console.error('Error fetching now playing movies:', error)
    }
  }

  const handleDateTimeAdd = () => {
    if (!dateTimeInputs) return

    const [date, time] = dateTimeInputs.split("T")
    if (!date || !time) return

    setDateTimeSelection((prev) => {
      const times = prev[date] || []

      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] }
      }

      return prev
    })

    setDateTimeInputs("")
  }

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = (prev[date] || []).filter((t) => t !== time)

      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev
        return rest
      }

      return { ...prev, [date]: filteredTimes }
    })
  }

  // ✅ FIXED HANDLE SUBMIT
  const handleSubmit = async () => {
    try {
      setAddingShow(true)

      if (!selectedMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
        toast.error("Missing required fields")
        return
      }

      // Convert dateTimeSelection to array
      const showsInput = []

      Object.entries(dateTimeSelection).forEach(([date, times]) => {
        times.forEach((time) => {
          showsInput.push({
            date: date,
            time: time // ✅ FIX (single time)
          })
        })
      })

      const payload = {
        movieId: selectedMovie,
        showInput: showsInput,
        showPrice: Number(showPrice)
      }

      console.log("Sending Payload:", payload)

      const { data } = await axios.post("/api/show/add", payload, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })

      if (data.success) {
        toast.success("Show added successfully")

        setSelectedMovie(null)
        setDateTimeSelection({})
        setShowPrice("")
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error("Submission error:", error)
      toast.error("An error occurred. Please try again")

    } finally {
      setAddingShow(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies()
    }
  }, [user])

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="add" text2="shows" />

      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">

          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className="relative max-w-40 cursor-pointer hover:-translate-y-1 transition duration-300"
              onClick={() => setSelectedMovie(movie.id)}
            >

              <div className="relative rounded-lg overflow-hidden">

                <img
                  src={image_base_url + movie.poster_path}
                  alt=""
                  className="w-full object-cover brightness-90"
                />

                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">

                  <p className="flex items-center gap-1 text-gray-400">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>

                  <p className="text-gray-300">
                    {kCoverter(movie.vote_count)} Votes
                  </p>

                </div>
              </div>

              {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-primary rounded">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}

              <p className="font-medium truncate">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.release_date}</p>

            </div>
          ))}

        </div>
      </div>

      {/* Show Price */}
      <div className="mt-8">

        <label className="block text-sm font-medium mb-2">Show Price</label>

        <div className="inline-flex items-center gap-2 border border-green-600 px-3 py-2 rounded-md">

          <p className="text-gray-400 text-sm">{currency}</p>

          <input
            min={0}
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter Show Price"
            className="outline-none"
          />

        </div>
      </div>

      {/* Date Time Input */}
      <div className="mt-8">

        <label className="block text-sm font-medium mb-2">
          Selected Date and Time
        </label>

        <div className="inline-flex items-center gap-5 border border-green-600 pl-3 p-1 rounded-lg">

          <input
            type="datetime-local"
            value={dateTimeInputs}
            onChange={(e) => setDateTimeInputs(e.target.value)}
            className="outline-none rounded-md"
          />

          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>

        </div>
      </div>

      {/* Display Selected Times */}
      {Object.keys(dateTimeSelection).length > 0 && (

        <div className="mt-6">

          <h2 className="mb-2">Selected Date-Time</h2>

          <ul className="space-y-3">

            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>

                <div className="font-medium">{date}</div>

                <div className="flex flex-wrap gap-2 mt-1 text-sm">

                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >

                      <span>{time}</span>

                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />

                    </div>
                  ))}

                </div>
              </li>
            ))}

          </ul>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={addingShow}
        className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
      >
        Add Show
      </button>

    </>
  ) : (
    <Loading />
  )
}

export default AddShows




