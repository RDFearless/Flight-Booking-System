import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import bookingService from "../api/bookingApi";
import walletService from "../api/walletApi";
import { formatPrice, formatTimeAndDate } from "../utils/format";
import { toast } from "react-toastify";

const BookingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUserId } = useSelector((state) => state.user);

    const flight = location.state?.flight;
    const passengerName = "Rudra Desai";

    const [bookingPreview, setBookingPreview] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!flight) {
            toast.error("No flight selected");
            navigate("/flights");
            return;
        }

        if (!currentUserId) {
            toast.error("Please select a user first");
            navigate("/flights");
            return;
        }

        fetchBookingPreview();
        fetchWalletBalance();
    }, []);

    const fetchBookingPreview = async () => {
        try {
            setLoading(true);
            const response = await bookingService.createBooking({
                userId: currentUserId,
                flightId: flight._id,
                passengerName,
            });
            setBookingPreview(response.data);
        } catch (error) {
            toast.error(error.message || "Failed to load booking preview");
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            const response = await walletService.getWalletBalance(
                currentUserId
            );
            console.log("Wallet Response:", response);
            console.log("Wallet Balance:", response.data.balance);
            setWalletBalance(Number(response.data.balance));
        } catch (error) {
            console.error("Failed to fetch wallet balance:", error);
        }
    };

    const handleConfirmBooking = async () => {
        if (!bookingPreview) return;

        if (walletBalance < bookingPreview.amountToBePaid) {
            toast.error("Insufficient wallet balance");
            return;
        }

        try {
            setConfirming(true);
            const response = await bookingService.bookTicket({
                userId: currentUserId,
                flightId: flight._id,
                passengerName,
            });

            toast.success(
                `Booking confirmed! PNR: ${response.data.booking.pnr}`
            );
            navigate("/booking-history");
        } catch (error) {
            toast.error(error.message || "Failed to confirm booking");
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-700 text-lg">
                        Loading booking preview...
                    </p>
                </div>
            </div>
        );
    }

    if (!bookingPreview) {
        return null;
    }

    const surgeApplied = bookingPreview.amountToBePaid > flight.basePrice;
    const surgeAmount = bookingPreview.amountToBePaid - flight.basePrice;
    const surgePercentage = ((surgeAmount / flight.basePrice) * 100).toFixed(0);
    const hasSufficientBalance =
        Number(walletBalance) >= Number(bookingPreview.amountToBePaid);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate("/flights")}
                        className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                            />
                        </svg>
                        Back to Flights
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Booking Preview
                        </h1>
                        <p className="text-orange-100">
                            Review your ticket details before confirming
                        </p>
                    </div>

                    <div className="p-8">
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                        Flight Details
                                    </h2>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Airline
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {flight.airline}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Flight ID
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {flight.flightId}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500">
                                                        From
                                                    </p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {flight.departureCity}
                                                    </p>
                                                </div>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="w-8 h-8 text-orange-500"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                                                    />
                                                </svg>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                        To
                                                    </p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {flight.arrivalCity}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                        Passenger Details
                                    </h2>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 rounded-full p-3">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="w-6 h-6 text-orange-600"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Passenger Name
                                                </p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {passengerName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                        Price Breakdown
                                    </h2>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Base Price
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {formatPrice(flight.basePrice)}
                                            </span>
                                        </div>
                                        {surgeApplied && (
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600">
                                                        Surge Pricing
                                                    </span>
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                                        +{surgePercentage}%
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-red-600">
                                                    +{formatPrice(surgeAmount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-900">
                                                Total Amount
                                            </span>
                                            <span className="text-2xl font-bold text-orange-600">
                                                {formatPrice(
                                                    bookingPreview.amountToBePaid
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                        Wallet Balance
                                    </h2>
                                    <div
                                        className={`rounded-lg p-4 ${
                                            hasSufficientBalance
                                                ? "bg-green-50 border border-green-200"
                                                : "bg-red-50 border border-red-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`rounded-full p-3 ${
                                                        hasSufficientBalance
                                                            ? "bg-green-100"
                                                            : "bg-red-100"
                                                    }`}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className={`w-6 h-6 ${
                                                            hasSufficientBalance
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">
                                                        Available Balance
                                                    </p>
                                                    <p className="text-xl font-bold text-gray-900">
                                                        {formatPrice(
                                                            walletBalance
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {!hasSufficientBalance && (
                                            <div className="mt-3 pt-3 border-t border-red-200">
                                                <p className="text-sm text-red-700 font-medium">
                                                    Insufficient balance. Please
                                                    add funds to your wallet.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {surgeApplied && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-6 h-6 text-yellow-600 flex-shrink-0"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                                                />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-semibold text-yellow-800 mb-1">
                                                    Surge Pricing Active
                                                </p>
                                                <p className="text-xs text-yellow-700">
                                                    High demand detected. Price
                                                    increased by{" "}
                                                    {surgePercentage}%.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate("/flights")}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={
                                        !hasSufficientBalance || confirming
                                    }
                                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {confirming ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                            Confirming...
                                        </span>
                                    ) : (
                                        "Confirm Booking"
                                    )}
                                </button>
                            </div>
                            {!hasSufficientBalance && (
                                <button
                                    onClick={() => navigate("/wallet")}
                                    className="w-full mt-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
                                >
                                    Add Funds to Wallet
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
