package com.researchsystem.backend.dto.request;

import com.researchsystem.backend.domain.enums.FinalDecision;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sent by the PRESIDENT when finalising a council minute.
 *
 * This is the ONLY payload that authorises:
 *   - Minute.minuteStatus → PUBLISHED
 *   - Topic macro-FSM transition (APPROVED / REVISION_REQUIRED / REJECTED)
 *   - Asynchronous notification fan-out (investigator, dept. head, managers)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MinuteApprovalRequest {

    @NotNull(message = "Kết luận chính thức là bắt buộc")
    private FinalDecision finalDecision;

    @NotNull(message = "Cần xác nhận pháp lý trước khi công bố")
    private Boolean legalConfirmation;

    @AssertTrue(message = "finalDecision phải khác PENDING")
    public boolean isDecisionConcrete() {
        return finalDecision != null && finalDecision != FinalDecision.PENDING;
    }

    @AssertTrue(message = "Cần tích chọn xác nhận pháp lý")
    public boolean isLegalConfirmationTrue() {
        return Boolean.TRUE.equals(legalConfirmation);
    }
}
